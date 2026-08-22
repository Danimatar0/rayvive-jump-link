import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { OrdersApiError, listOrders, type Order } from "@/lib/ordersApi";
import { formatMoney } from "@/config/commerce";
import StatusBadge from "@/components/admin/StatusBadge";

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const PAYMENT_STATUSES = ["COD", "Pending", "Paid", "Failed"];

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "highest", label: "Highest value" },
  { id: "lowest", label: "Lowest value" },
];

function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const Orders = () => {
  const { token, logout, handleUnauthorized } = useAdminAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const load = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listOrders(token);
      setOrders(data.orders);
    } catch (err) {
      if (err instanceof OrdersApiError && err.code === "UNAUTHORIZED") {
        handleUnauthorized();
        return;
      }
      setError(err instanceof OrdersApiError ? err.message : "Could not load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // Compare on date only, so a "to" of today includes orders placed today.
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    const result = orders.filter((order) => {
      if (statusFilter && order.orderStatus !== statusFilter) return false;
      if (paymentFilter && order.paymentStatus !== paymentFilter) return false;

      if (from !== null || to !== null) {
        const placed = new Date(order.orderDate || order.createdAt || "").getTime();
        if (Number.isNaN(placed)) return false;
        if (from !== null && placed < from) return false;
        if (to !== null && placed > to) return false;
      }

      if (term) {
        const haystack = [
          order.orderId,
          order.customer.fullName,
          order.customer.phone,
          order.customer.email,
          order.itemsSummary ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    const byDate = (order: Order) =>
      new Date(order.orderDate || order.createdAt || 0).getTime();

    return result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return byDate(a) - byDate(b);
        case "highest":
          return b.total - a.total;
        case "lowest":
          return a.total - b.total;
        default:
          return byDate(b) - byDate(a);
      }
    });
  }, [orders, search, statusFilter, paymentFilter, fromDate, toDate, sort]);

  const revenue = useMemo(
    () =>
      filtered
        .filter((order) => order.orderStatus !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0),
    [filtered]
  );

  const hasActiveFilters =
    Boolean(search || statusFilter || paymentFilter || fromDate || toDate);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setFromDate("");
    setToDate("");
  };

  const selectClass =
    "h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition";

  return (
    <main className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Orders</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              disabled={isLoading}
              className="h-10 px-3 rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={logout}
              className="h-10 px-3 rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-card border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Orders shown</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{filtered.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Value (excl. cancelled)</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatMoney(revenue)}
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">Awaiting action</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {orders.filter((order) => order.orderStatus === "Pending").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-2xl p-4 mb-6 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order ID, name, phone or email…"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={selectClass}
              aria-label="Filter by order status"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className={selectClass}
              aria-label="Filter by payment status"
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={selectClass}
              aria-label="Sort orders"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className={selectClass}
              aria-label="Orders from date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className={selectClass}
              aria-label="Orders to date"
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-11 px-3 rounded-xl border border-border hover:bg-muted transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {error && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{error}</p>
              <button
                onClick={() => void load()}
                className="text-sm text-primary font-semibold hover:underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-card border rounded-2xl p-12 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <p className="text-lg font-semibold text-foreground mb-1">No orders found</p>
            <p className="text-muted-foreground text-sm">
              {orders.length === 0
                ? "Orders placed on the website will appear here."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((order) => (
                // The card is one big tap target, but the phone number has to
                // stay separately tappable. Nesting one <a> inside another is
                // invalid HTML, so the card link is an overlay and the phone
                // link sits above it on the z-axis.
                <li
                  key={order.orderId}
                  className="relative bg-card border rounded-2xl p-4 hover:border-primary/50 transition-colors"
                >
                  <Link
                    to={`/orders/${encodeURIComponent(order.orderId)}`}
                    aria-label={`Open order ${order.orderId}`}
                    className="absolute inset-0 rounded-2xl"
                  />

                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-foreground truncate">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.orderDate || order.createdAt || "")}
                      </p>
                    </div>
                    <span className="font-bold text-foreground tabular-nums whitespace-nowrap">
                      {formatMoney(order.total)}
                    </span>
                  </div>

                  <p className="font-medium text-foreground truncate">
                    {order.customer.fullName}
                  </p>
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="relative z-10 inline-block text-sm text-primary hover:underline"
                  >
                    {order.customer.phone}
                  </a>

                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {order.itemsSummary}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <StatusBadge value={order.orderStatus} />
                    <StatusBadge value={order.paymentStatus} kind="payment" />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden lg:block bg-card border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Order ID</th>
                      <th className="text-left font-semibold px-4 py-3">Date</th>
                      <th className="text-left font-semibold px-4 py-3">Customer</th>
                      <th className="text-left font-semibold px-4 py-3">Phone</th>
                      <th className="text-left font-semibold px-4 py-3">Items</th>
                      <th className="text-right font-semibold px-4 py-3">Qty</th>
                      <th className="text-right font-semibold px-4 py-3">Total</th>
                      <th className="text-left font-semibold px-4 py-3">Payment</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr
                        key={order.orderId}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                          <Link
                            to={`/orders/${encodeURIComponent(order.orderId)}`}
                            className="hover:text-primary"
                          >
                            {order.orderId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(order.orderDate || order.createdAt || "")}
                        </td>
                        <td className="px-4 py-3 font-medium max-w-[12rem] truncate">
                          {order.customer.fullName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`tel:${order.customer.phone}`} className="text-primary hover:underline">
                            {order.customer.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[16rem] truncate">
                          {order.itemsSummary}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{order.itemCount}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={order.paymentStatus} kind="payment" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={order.orderStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/orders/${encodeURIComponent(order.orderId)}`}
                            aria-label={`Open order ${order.orderId}`}
                            className="text-muted-foreground hover:text-primary inline-flex"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Orders;
