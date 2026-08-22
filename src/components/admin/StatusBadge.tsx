/** Colour-coded pills for order and payment status, shared by list and detail. */

const ORDER_STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  Processing: "bg-violet-100 text-violet-800 border-violet-200",
  Shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  COD: "bg-slate-100 text-slate-700 border-slate-200",
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Failed: "bg-red-100 text-red-800 border-red-200",
};

const FALLBACK = "bg-slate-100 text-slate-700 border-slate-200";

interface StatusBadgeProps {
  value: string;
  kind?: "order" | "payment";
}

const StatusBadge = ({ value, kind = "order" }: StatusBadgeProps) => {
  const styles = kind === "payment" ? PAYMENT_STATUS_STYLES : ORDER_STATUS_STYLES;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
        styles[value] ?? FALLBACK
      }`}
    >
      {value || "—"}
    </span>
  );
};

export default StatusBadge;
