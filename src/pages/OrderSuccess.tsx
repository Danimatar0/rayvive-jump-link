import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, MessageCircle, Package, Phone, Truck } from "lucide-react";
import Footer from "@/components/Footer";
import { STORE, formatMoney } from "@/config/commerce";
import { createWhatsAppLink } from "@/config/constants";
import { trackPurchaseOnce } from "@/lib/metaPixel";
import type { Order } from "@/lib/ordersApi";

/**
 * Keeps the confirmation readable across a refresh. React Router keeps
 * location.state in history state, but a hard reload in some browsers drops it,
 * and a customer refreshing their receipt should still see it.
 */
const LAST_ORDER_KEY = "rayvive_last_order";

function readCachedOrder(): Order | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

const OrderSuccess = () => {
  const location = useLocation();
  const stateOrder = (location.state as { order?: Order } | null)?.order ?? null;
  const [order] = useState<Order | null>(() => stateOrder ?? readCachedOrder());
  const purchaseHandledRef = useRef(false);

  useEffect(() => {
    if (!order) return;

    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {
      // Non-fatal: the page still renders from the in-memory copy.
    }
  }, [order]);

  useEffect(() => {
    if (!order || purchaseHandledRef.current) return;
    purchaseHandledRef.current = true;

    // Purchase fires only here — after the server created the order and gave us
    // a real order id. trackPurchaseOnce keeps a log of order ids that have
    // already been reported, so refreshing this page does not fire it again,
    // and the order id is sent as the Meta eventID for server-side dedup too.
    trackPurchaseOnce(order.orderId, {
      value: order.total,
      currency: order.currency || STORE.currency,
      content_type: "product",
      content_ids: (order.items ?? []).map((item) => item.productId),
      contents: (order.items ?? []).map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        item_price: item.unitPrice,
      })),
      num_items: (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [order]);

  const whatsappHref = useMemo(() => {
    if (!order) return createWhatsAppLink("Hi! I have a question about my Rayvive order.");
    return createWhatsAppLink(
      `Hi! I need help with my Rayvive order ${order.orderId}.`
    );
  }, [order]);

  if (!order) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 container mx-auto px-6 py-20 max-w-xl text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">No order to show</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find a recent order in this browser. If you've just ordered, check
            your phone for our confirmation call.
          </p>
          <Link to="/" className="btn-energy inline-block">
            Back to the store
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const items = order.items ?? [];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          {/* Confirmation header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-11 h-11 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Thank you for your order!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your order has been received successfully.
            </p>
            <p className="mt-5 inline-block bg-muted rounded-full px-5 py-2 font-mono font-bold text-foreground">
              Order #{order.orderId}
            </p>
          </div>

          {/* What happens next */}
          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">What happens next</h2>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  We call <strong className="text-foreground">{order.customer.phone}</strong> to
                  confirm your order and delivery time.
                </span>
              </li>
              <li className="flex gap-3">
                <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">We pack and dispatch your rope.</span>
              </li>
              <li className="flex gap-3">
                <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Pay <strong className="text-foreground">{formatMoney(order.total)}</strong> in
                  cash when it arrives.
                </span>
              </li>
            </ol>
          </section>

          {/* Order summary */}
          <section className="bg-card border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-5">Order summary</h2>

            <ul className="space-y-3 mb-5">
              {items.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground font-medium">{item.name}</strong>
                    {item.variant && ` (${item.variant})`} × {item.quantity}
                  </span>
                  <span className="font-semibold tabular-nums whitespace-nowrap">
                    {formatMoney(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{formatMoney(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base border-t pt-3 mt-3">
                <dt className="font-bold text-foreground">Total</dt>
                <dd className="font-black text-primary tabular-nums">
                  {formatMoney(order.total)}
                </dd>
              </div>
            </dl>

            <p className="text-sm text-muted-foreground mt-4">
              Payment method:{" "}
              <span className="text-foreground font-medium">{order.paymentMethod}</span>
            </p>
          </section>

          {/* Delivery details */}
          <section className="bg-card border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Delivering to</h2>
            <address className="not-italic text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">{order.customer.fullName}</span>
              <br />
              {order.shipping.address}
              {order.shipping.building && (
                <>
                  <br />
                  {order.shipping.building}
                </>
              )}
              <br />
              {order.shipping.area}, {order.shipping.city}
              <br />
              {order.shipping.country}
              <br />
              {order.customer.phone}
            </address>

            {order.shipping.notes && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                <span className="font-medium text-foreground">Notes:</span>{" "}
                {order.shipping.notes}
              </p>
            )}
          </section>

          {/* Support — WhatsApp is now support, not the ordering channel */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Need help with your order?</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border hover:bg-muted transition-colors font-medium text-foreground"
            >
              <MessageCircle className="w-5 h-5" />
              Contact us on WhatsApp
            </a>

            <div className="mt-8">
              <Link to="/collection" className="text-primary font-semibold hover:underline">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default OrderSuccess;
