import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

/**
 * Site header with the cart entry point.
 *
 * The homepage Hero is a full-bleed gradient, so on "/" the header starts
 * transparent with white text and only fades in a solid background once the
 * visitor scrolls past it. On every other route it is solid from the start.
 */
const SiteHeader = () => {
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  return (
    <header
      className={`top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        // Fixed over the full-bleed Hero so the gradient runs behind it; sticky
        // elsewhere so it occupies layout space instead of covering content.
        isHome ? "fixed" : "sticky"
      } ${
        transparent
          ? "bg-transparent"
          : "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
      }`}
    >
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className={`text-2xl font-black tracking-tight transition-colors ${
            transparent ? "text-white" : "text-foreground"
          }`}
        >
          RAYVIVE
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/collection"
            className={`hidden sm:inline text-sm font-semibold transition-colors ${
              transparent ? "text-white/90 hover:text-white" : "text-muted-foreground hover:text-primary"
            }`}
          >
            Collection
          </Link>

          <Link
            to="/cart"
            aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
              transparent
                ? "text-white hover:bg-white/15"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader;
