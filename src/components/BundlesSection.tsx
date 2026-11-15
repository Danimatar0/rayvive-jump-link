import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { getProduct, isPurchasable } from "@/lib/catalog";
import { formatMoney } from "@/config/commerce";
import { isSaleActive, SALE_BUNDLE_IDS } from "@/config/sale";

/**
 * Black November bundles. Prices, original prices and photos all come from
 * products.json via the catalog, so this section never hard-codes a price.
 * Hidden automatically once the sale ends.
 */
const BundlesSection = () => {
  const navigate = useNavigate();

  if (!isSaleActive()) return null;

  const bundles = SALE_BUNDLE_IDS.map((id) => getProduct(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );

  return (
    <section id="bundles" className="py-24 bg-background scroll-mt-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block bg-foreground text-background px-5 py-2 rounded-full text-sm font-bold tracking-widest mb-6">
            BLACK NOVEMBER · ENDS NOV 30
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-6">
            3 Bundles. <span className="text-primary">$30 Each.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pick your bundle, choose your colors. Built for every level, priced for this month only.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((product) => (
            <div
              key={product.id}
              className="relative bg-card rounded-3xl border-2 border-primary shadow-[var(--glow-shadow)] p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-in"
            >
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap">
                    SAVE {formatMoney(product.originalPrice - product.price)}
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                {product.listImage && (
                  <img
                    src={product.listImage}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-2xl mb-4"
                    loading="lazy"
                  />
                )}
                <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
              </div>

              <div className="text-center mb-6">
                {product.originalPrice && (
                  <div className="text-lg text-muted-foreground line-through mb-1">
                    {formatMoney(product.originalPrice)}
                  </div>
                )}
                <span className="text-4xl font-bold text-primary">{formatMoney(product.price)}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                    <Star className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(product.url)}
                disabled={!isPurchasable(product)}
                className="w-full btn-energy py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Colors
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BundlesSection;
