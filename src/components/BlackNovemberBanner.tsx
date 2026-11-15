import { Link } from "react-router-dom";
import { isSaleActive } from "@/config/sale";

/**
 * Thin announcement strip shown at the top of every page during the sale.
 * Rendered inside SiteHeader so it appears on every route.
 */
const BlackNovemberBanner = () => {
  if (!isSaleActive()) return null;

  return (
    <Link
      to="/#bundles"
      className="block w-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
    >
      <div className="container mx-auto px-6 py-2 text-center text-xs sm:text-sm font-semibold tracking-wide">
        <span className="text-primary font-black">BLACK NOVEMBER</span>
        <span className="mx-2 opacity-60">·</span>
        3 bundles, $30 each
        <span className="hidden sm:inline">
          <span className="mx-2 opacity-60">·</span>
          Ends Nov 30
        </span>
        <span className="ml-2 underline underline-offset-2">Shop now</span>
      </div>
    </Link>
  );
};

export default BlackNovemberBanner;
