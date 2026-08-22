import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, Loader2, Lock, Truck } from "lucide-react";
import Footer from "@/components/Footer";
import { useCart, useCartTotalsForZone } from "@/context/CartContext";
import {
  DELIVERY_CITIES,
  ENABLED_PAYMENT_METHODS,
  STORE,
  formatMoney,
} from "@/config/commerce";
import { zoneForCity } from "@/lib/shipping";
import { describeSource, getAttribution, getFbp } from "@/lib/attribution";
import { trackPixelEvent } from "@/lib/metaPixel";
import {
  OrdersApiError,
  createRequestId,
  isOrdersApiConfigured,
  submitOrder,
} from "@/lib/ordersApi";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => {
      const digits = value.replace(/[^0-9]/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Enter a valid phone number so we can confirm your order"),
  // Optional: this is a cash-on-delivery store, so an email is not needed to
  // fulfil the order. Asking for less improves completion on paid traffic.
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email address").max(200)])
    .optional(),
  city: z.string().min(1, "Please choose your city"),
  area: z.string().trim().min(1, "Area is required").max(160),
  address: z.string().trim().min(1, "Street address is required").max(400),
  building: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-input bg-background text-base " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition";

const Checkout = () => {
  const navigate = useNavigate();
  const { lines, isEmpty, clearCart } = useCart();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minted once per checkout attempt and reused across retries, so a retry
  // after a timeout resolves to the same order rather than creating a second.
  const requestIdRef = useRef<string>(createRequestId());
  const orderPlacedRef = useRef(false);
  const initiateFiredRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { city: "", building: "", notes: "", email: "" },
  });

  const selectedCity = watch("city");
  const zone = useMemo(() => zoneForCity(selectedCity), [selectedCity]);
  const totals = useCartTotalsForZone(lines, zone);
  const paymentMethod = ENABLED_PAYMENT_METHODS[0];

  // An empty cart has nothing to check out — unless we just emptied it after a
  // successful order, in which case we're already navigating away.
  useEffect(() => {
    if (isEmpty && !orderPlacedRef.current) {
      navigate("/cart", { replace: true });
    }
  }, [isEmpty, navigate]);

  // InitiateCheckout fires once per visit to this page. The ref guard survives
  // re-renders from typing in the form, which would otherwise re-fire it.
  useEffect(() => {
    if (initiateFiredRef.current || lines.length === 0) return;
    initiateFiredRef.current = true;

    trackPixelEvent("InitiateCheckout", {
      content_ids: lines.map((line) => line.product.id),
      content_type: "product",
      contents: lines.map((line) => ({
        id: line.product.id,
        quantity: line.quantity,
        item_price: line.unitPrice,
      })),
      num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
      value: totals.subtotal,
      currency: STORE.currency,
    });
    // Intentionally keyed on cart contents only; totals shift with the city
    // selection and must not retrigger the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const onSubmit = async (values: CheckoutForm) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const attribution = getAttribution();

    try {
      const { order } = await submitOrder({
        clientRequestId: requestIdRef.current,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email ?? "",
          phone: values.phone,
        },
        shipping: {
          city: values.city,
          area: values.area,
          address: values.address,
          building: values.building ?? "",
          notes: values.notes ?? "",
        },
        paymentMethod: paymentMethod.id,
        items: lines.map((line) => ({
          productId: line.product.id,
          variant: line.variant,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        attribution: {
          source: describeSource(attribution),
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmContent: attribution.utmContent,
          utmTerm: attribution.utmTerm,
          landingPage: attribution.landingPage,
          referrer: attribution.referrer,
          fbclid: attribution.fbclid,
          fbp: getFbp(),
        },
      });

      // Only now is the order real: it exists in Google Sheets and we have its
      // id. Purchase is fired on the confirmation page, never before this point.
      orderPlacedRef.current = true;
      clearCart();
      navigate("/order-success", { state: { order }, replace: true });
    } catch (error) {
      if (error instanceof OrdersApiError) {
        // Map server-side field errors back onto the form where possible.
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            if (field in checkoutSchema.shape) {
              setError(field as keyof CheckoutForm, { type: "server", message });
            }
          });
        }
        setSubmitError(error.message);
      } else {
        setSubmitError("Something went wrong while placing your order. Please try again.");
      }
      console.error("Order submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty) return null;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-10 max-w-6xl">
          <Link
            to="/cart"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to cart
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-8">Checkout</h1>

          {!isOrdersApiConfigured() && (
            <div className="mb-8 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Online ordering is not configured yet (<code>VITE_ORDERS_API_URL</code> is
                missing). Orders cannot be submitted until it is set.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid lg:grid-cols-[1fr_380px] gap-8 items-start"
          >
            <div className="space-y-6">
              {/* Customer information */}
              <section className="bg-card border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-5">Contact details</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      className={inputClass}
                      aria-invalid={Boolean(errors.firstName)}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1.5">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      className={inputClass}
                      aria-invalid={Boolean(errors.lastName)}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1.5">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="03 123 456"
                      className={inputClass}
                      aria-invalid={Boolean(errors.phone)}
                      {...register("phone")}
                    />
                    {errors.phone ? (
                      <p className="text-sm text-destructive mt-1.5">{errors.phone.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        We call this number to confirm your delivery.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                      Email <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      className={inputClass}
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1.5">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping information */}
              <section className="bg-card border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-5">Delivery address</h2>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium mb-1.5">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        value={STORE.country}
                        readOnly
                        className={`${inputClass} bg-muted/50 text-muted-foreground cursor-not-allowed`}
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium mb-1.5">
                        City / Governorate
                      </label>
                      {/* Native select: mobile browsers render their own picker,
                          which is faster to use than a custom dropdown. */}
                      <select
                        id="city"
                        autoComplete="address-level1"
                        className={inputClass}
                        aria-invalid={Boolean(errors.city)}
                        {...register("city")}
                      >
                        <option value="">Choose your city…</option>
                        {DELIVERY_CITIES.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1.5">{errors.city.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="area" className="block text-sm font-medium mb-1.5">
                      Area / Neighbourhood
                    </label>
                    <input
                      id="area"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="e.g. Hamra, Achrafieh, Jounieh"
                      className={inputClass}
                      aria-invalid={Boolean(errors.area)}
                      {...register("area")}
                    />
                    {errors.area && (
                      <p className="text-sm text-destructive mt-1.5">{errors.area.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1.5">
                      Street address
                    </label>
                    <input
                      id="address"
                      type="text"
                      autoComplete="street-address"
                      placeholder="Street name, landmark"
                      className={inputClass}
                      aria-invalid={Boolean(errors.address)}
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1.5">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="building" className="block text-sm font-medium mb-1.5">
                      Building / Floor / Apartment{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      id="building"
                      type="text"
                      className={inputClass}
                      {...register("building")}
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
                      Delivery notes{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Anything that helps the driver find you"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
                      {...register("notes")}
                    />
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section className="bg-card border rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-5">Payment</h2>

                <div className="flex items-start gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
                  <div className="w-5 h-5 rounded-full border-[6px] border-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{paymentMethod.label}</p>
                    <p className="text-sm text-muted-foreground">{paymentMethod.description}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Order summary */}
            <aside className="bg-card border rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-foreground mb-5">Your order</h2>

              <ul className="space-y-4 mb-5">
                {lines.map((line) => (
                  <li key={line.lineId} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-lg bg-muted/40 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {line.product.listImage || line.product.images[0] ? (
                        <img
                          src={line.product.listImage ?? line.product.images[0]}
                          alt=""
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xl">{line.product.emoji}</span>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-muted-foreground text-background text-xs font-bold flex items-center justify-center">
                        {line.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {line.product.name}
                      </p>
                      {line.variantLabel && (
                        <p className="text-xs text-muted-foreground truncate">
                          {line.variantLabel}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(line.unitPrice)} each
                      </p>
                    </div>

                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(line.total)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-3 text-sm border-t pt-5">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {zone ? (
                      formatMoney(totals.shipping)
                    ) : (
                      <span className="font-normal text-muted-foreground">Choose a city</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="border-t mt-5 pt-5 flex justify-between items-baseline">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-black text-primary tabular-nums">
                  {zone ? formatMoney(totals.total) : `${formatMoney(totals.subtotal)}+`}
                </span>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="mt-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
                >
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{submitError}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your cart is safe — press the button again to retry.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-energy w-full mt-6 flex items-center justify-center gap-2 text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing your order…
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Place order
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                {zone
                  ? `You pay ${formatMoney(totals.total)} in cash when your order arrives.`
                  : "Choose your city to see the final total."}
              </p>
            </aside>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Checkout;
