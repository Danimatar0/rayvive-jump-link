import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import productsData from "../data/products.json";
import novaWhiteImg from "../assets/nova-white-img.jpeg";
import aetherDottedImg from "../assets/aether-dotted-img.jpeg";
import comboPackageImg from "../assets/combo-package-img.jpeg";

const CollectionSection = () => {
  const navigate = useNavigate();

  const products = Object.values(productsData);

  const getProductImage = (imageFileName: string) => {
    const imageMap: Record<string, string> = {
      "nova-white-img.jpeg": novaWhiteImg,
      "aether-dotted-img.jpeg": aetherDottedImg,
      "combo-package-img.jpeg": comboPackageImg,
    };
    return imageMap[imageFileName];
  };

  return (
    <section id="collection" className="py-24 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Our <span className="text-primary">Collection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Premium jump ropes designed for every fitness enthusiast. Choose your perfect companion.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className={`relative bg-card rounded-3xl border-2 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in ${
                product.popular ? 'border-primary shadow-[var(--glow-shadow)]' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {product.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold">
                    BEST VALUE
                  </div>
                </div>
              )}

              {/* Product Image */}
              <div className="text-center mb-6">
                {product.listImage ? (
                  <img
                    src={getProductImage(product.listImage)}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-2xl mb-4"
                  />
                ) : (
                  <div className="text-6xl mb-4">{product.image}</div>
                )}
                <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {product.originalPrice && (
                  <div className="text-lg text-muted-foreground line-through mb-1">
                    {product.originalPrice}
                  </div>
                )}
                <span className="text-4xl font-bold text-primary">{product.price}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                    <Star className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button 
                onClick={() => navigate(`/product/${product.id}`)}
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  product.popular 
                    ? 'btn-energy' 
                    : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionSection;
