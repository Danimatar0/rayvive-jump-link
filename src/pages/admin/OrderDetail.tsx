import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  OrdersApiError,
  getOrder,
  updateOrderStatus,
  type Order,
} from "@/lib/ordersApi";
import { formatMoney } from "@/config/commerce";
import { createWhatsAppLink } from "@/config/constants";
import StatusBadge from "@/components/admin/StatusBadge";

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["COD", "Pending", "Paid", "Failed"];

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { token, handleUnauthorized } = useAdminAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<"order" | "payment" | null>(null);
  const [savedField, setSavedField] = useState<"order" | "payment" | null>(null);

  const load = useCallback(async () => {
    if (!token || !orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      setOrder(await getOrder(token, orderId));
    } catch (err) {
      if (err instanceof OrdersApiError && err.code === "UNAUTHORIZED") {
        handleUnauthorized();
        return;
      }
      setError(err instanceof OrdersApiError ? err.message : "Could not load this order.");
    } finally {
      setIsLoading(false);
    }
  }, [token, orderId, handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Writes the new status through to the sheet. The local state is updated
   * only after the server confirms, so the dashboard never shows a status the
   * spreadsheet does not have.
   */
  const changeStatus = async (kind: "order" | "payment", value: string) => {
    if (!token || !order) return;

    setSavingField(kind);
    setSavedField(null);
    setError(null);

    const previous = order;
    try {
      await updateOrderStatus(token, order.orderId,
        kind === "order" ? { orderStatus: value } : { paymentStatus: value }
      );
      setOrder({
        ...order,
        ...(kind === "order" ? { orderStatus: value } : { paymentStatus: value }),
      });
      setSavedField(kind);
      setTimeout(() => setSavedField(null), 2000);
    } catch (err) {
      setOrder(previous);
      if (err instanceof OrdersApiError && err.code === "UNAUTHORIZED") {
        handleUnauthorized();
        return;
      }
      setError(err instanceof OrdersApiError ? err.message : "Could not update the status.");
    } finally {
      setSavingField(null);
    }
  };

  const selectClass =
    "w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading order…
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center px-6">
        <div className="bg-card border rounded-2xl p-10 text-center max-w-sm">
          <p className="text-lg font-semibold text-foreground mb-2">Order not found</p>
          <p className="text-sm text-muted-foreground mb-6">
            {error ?? `We couldn't find order ${orderId}.`}
          </p>
          <Link to="/orders" className="btn-energy inline-block">
            Back to orders
          </Link>
        </div>
      </main>
    );
  }

  const items = order.items ?? [];

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link
            to="/orders"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">All orders</span>
          </Link>
          <h1 className="font-mono font-bold text-foreground truncate ml-2">{order.orderId}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl space-y-5">
        {error && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {/* Status controls */}
        <section className="bg-card border rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <StatusBadge value={order.orderStatus} />
            <StatusBadge value={order.paymentStatus} kind="payment" />
            <span className="text-sm text-muted-foreground ml-auto">
              {order.orderDate ? new Date(order.orderDate).toLocaleString() : ""}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-status" className="block text-sm font-medium mb-1.5">
                Order status
                {savingField === "order" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-muted-foreground" />
                )}
                {savedField === "order" && (
                  <Check className="w-3.5 h-3.5 inline ml-2 text-emerald-600" />
                )}
              </label>
              <select
                id="order-status"
                value={order.orderStatus}
                disabled={savingField !== null}
                onChange={(event) => void changeStatus("order", event.target.value)}
                className={selectClass}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payment-status" className="block text-sm font-medium mb-1.5">
                Payment status
                {savingField === "payment" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-muted-foreground" />
                )}
                {savedField === "payment" && (
                  <Check className="w-3.5 h-3.5 inline ml-2 text-emerald-600" />
                )}
              </label>
              <select
                id="payment-status"
                value={order.paymentStatus}
                disabled={savingField !== null}
                onChange={(event) => void changeStatus("payment", event.target.value)}
                className={selectClass}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Customer */}
        <section className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">Customer</h2>
          <p className="font-medium text-foreground mb-3">{order.customer.fullName}</p>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${order.customer.phone}`}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              {order.customer.phone}
            </a>

            <a
              href={createWhatsAppLink(
                `Hi ${order.customer.firstName}, about your Rayvive order ${order.orderId}:`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            {order.customer.email && (
              <a
                href={`mailto:${order.customer.email}`}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                {order.customer.email}
              </a>
            )}
          </div>
        </section>

        {/* Delivery */}
        <section className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">Delivery</h2>
          <address className="not-italic text-muted-foreground leading-relaxed text-sm">
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
          </address>

          {order.shipping.notes && (
            <p className="text-sm mt-4 pt-4 border-t">
              <span className="font-medium text-foreground">Notes:</span>{" "}
              <span className="text-muted-foreground">{order.shipping.notes}</span>
            </p>
          )}
        </section>

        {/* Items */}
        <section className="bg-card border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">Items</h2>

          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-4 text-sm pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.variant && <p className="text-muted-foreground">{item.variant}</p>}
                  <p className="text-muted-foreground">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatMoney(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No line items recorded. Summary: {order.itemsSummary || "—"}
            </p>
          )}

          <dl className="space-y-2 text-sm border-t mt-4 pt-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{formatMoney(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between text-base pt-2 border-t mt-2">
              <dt className="font-bold text-foreground">Total</dt>
              <dd className="font-black text-primary tabular-nums">
                {formatMoney(order.total)}
              </dd>
            </div>
          </dl>

          <p className="text-sm text-muted-foreground mt-4">
            Paid by <span className="text-foreground font-medium">{order.paymentMethod}</span>
          </p>
        </section>

        {/* Attribution — which ad produced this sale */}
        {(order.source || order.utmCampaign) && (
          <section className="bg-card border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4">Where this order came from</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Source", order.source],
                ["Campaign", order.utmCampaign],
                ["Medium", order.utmMedium],
                ["Content", order.utmContent],
                ["Term", order.utmTerm],
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-foreground font-medium text-right break-all">{value}</dd>
                  </div>
                ))}
            </dl>

            {order.landingPage && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t break-all">
                Landed on: {order.landingPage}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default OrderDetail;
