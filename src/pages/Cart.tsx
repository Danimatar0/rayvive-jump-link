import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/config/commerce";
import { shippingSummaryLabel } from "@/lib/shipping";

const Cart = () => {
  const navigate = useNavigate();
  const { lines, itemCount, isEmpty, totals, incrementLine, decrementLine, removeLine } = useCart();

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Continue shopping
          </button>

          <h1 className="text-4xl font-bold text-foreground mb-8">
            Your <span className="text-primary">Cart</span>
          </h1>

          {isEmpty ? (
            <div className="bg-card border rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">
                Browse the collection and add a rope to get started.
              </p>
              <Link to="/collection" className="btn-energy inline-block">
                View Collection
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
              {/* Line items */}
              <ul className="space-y-4">
                {lines.map((line) => (
                  <li
                    key={line.lineId}
                    className="bg-card border rounded-2xl p-4 sm:p-5 flex gap-4"
                  >
                    <Link
                      to={line.product.url}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted/40 flex-shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      {line.product.listImage || line.product.images[0] ? (
                        <img
                          src={line.product.listImage ?? line.product.images[0]}
                          alt={line.product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl">{line.product.emoji}</span>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={line.product.url}
                            className="font-bold text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {line.product.name}
                          </Link>
                          {line.variantLabel && (
                            <p className="text-sm text-muted-foreground truncate">
                              {line.variantLabel}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatMoney(line.unitPrice)} each
                          </p>
                        </div>

                        <button
                          onClick={() => removeLine(line.lineId)}
                          aria-label={`Remove ${line.product.name} from cart`}
                          className="text-muted-foreground hover:text-destructive transition-colors h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 mt-3">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            onClick={() => decrementLine(line.lineId)}
                            aria-label={`Decrease quantity of ${line.product.name}`}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span
                            className="w-9 text-center font-semibold tabular-nums"
                            aria-live="polite"
                          >
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => incrementLine(line.lineId)}
                            disabled={line.quantity >= line.maxQuantity}
                            aria-label={`Increase quantity of ${line.product.name}`}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="font-bold text-lg text-foreground tabular-nums">
                          {formatMoney(line.total)}
                        </span>
                      </div>

                      {line.quantity >= line.maxQuantity && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Maximum {line.maxQuantity} per order.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Summary */}
              <div className="bg-card border rounded-2xl p-6 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-foreground mb-5">Order Summary</h2>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </dt>
                    <dd className="font-semibold tabular-nums">{formatMoney(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="text-muted-foreground text-right">Calculated at checkout</dd>
                  </div>
                </dl>

                <p className="text-xs text-muted-foreground mt-3">
                  Delivery: {shippingSummaryLabel()}
                </p>

                <div className="border-t mt-5 pt-5 flex justify-between items-baseline">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-black text-primary tabular-nums">
                    {formatMoney(totals.subtotal)}+
                  </span>
                </div>

                <Link
                  to="/checkout"
                  className="btn-energy w-full mt-6 flex items-center justify-center text-lg"
                >
                  Checkout
                </Link>

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Cash on delivery · No account needed
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Cart;
