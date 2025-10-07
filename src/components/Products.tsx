import { Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { openWhatsApp, WhatsAppMessages } from "@/lib/whatsapp";

const Products = () => {
  const navigate = useNavigate();

  const products = [
    {
      id: "full-white",
      name: "Full White",
      price: "$12.99",
      image: "🤍",
      features: ["Premium White Design", "Adjustable Length", "Smooth Rotation", "Beginner Friendly"],
      popular: false
    },
    {
      id: "dotted",
      name: "Dotted",
      price: "$14.99", 
      image: "⚪",
      features: ["Unique Dotted Pattern", "Enhanced Grip", "Weighted Design", "Pro Performance"],
      popular: false
    },
    {
      id: "combo-package",
      name: "Combo Package",
      price: "$24.99",
      originalPrice: "$27.98",
      image: "📦",
      features: ["Both Ropes Included", "Save $3", "Complete Training Set", "Best Value"],
      popular: true
    }
  ];

  const handleWhatsAppRecommendations = () => {
    openWhatsApp(WhatsAppMessages.recommendations);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Our <span className="text-primary">Premium Collection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Carefully crafted jump ropes designed for every fitness level and training style. 
            Find your perfect workout companion.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-3xl border-2 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                product.popular ? 'border-primary shadow-[var(--glow-shadow)]' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {product.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Product Icon */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce-in">{product.image}</div>
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
                Learn More
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-card rounded-3xl p-12 border">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Your Fitness Journey?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            All our jump ropes come with a 30-day satisfaction guarantee and lifetime customer support. 
            Contact us to find the perfect rope for your goals.
          </p>
          <button onClick={handleWhatsAppRecommendations} className="btn-energy">
            Get Personalized Recommendations
          </button>
        </div>
      </div>
    </section>
  );
};

export default Products;