import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import Footer from "@/components/Footer";

const Collection = () => {
  const navigate = useNavigate();

  const products = [
    {
      id: "full-white",
      name: "Full White",
      price: "$12.99",
      image: "🤍",
      features: ["Premium White Design", "Adjustable Length", "Smooth Rotation", "Beginner Friendly"],
      description: "Our classic Full White jump rope features a sleek, minimalist design perfect for any workout environment."
    },
    {
      id: "dotted",
      name: "Dotted",
      price: "$14.99", 
      image: "⚪",
      features: ["Unique Dotted Pattern", "Enhanced Grip", "Weighted Design", "Pro Performance"],
      description: "The Dotted rope combines style with functionality, featuring a unique pattern for enhanced visibility during workouts."
    },
    {
      id: "combo-package",
      name: "Combo Package",
      price: "$24.99",
      originalPrice: "$27.98",
      image: "📦",
      features: ["Both Ropes Included", "Save $3", "Complete Training Set", "Best Value"],
      description: "Get both the Full White and Dotted ropes in one package. Perfect for variety in your training routine.",
      popular: true
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Our <span className="text-primary">Collection</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Premium jump ropes designed for every fitness enthusiast. Choose your perfect companion.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className={`relative bg-card rounded-3xl border-2 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
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

                {/* Product Icon */}
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{product.image}</div>
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

      <Footer />
    </main>
  );
};

export default Collection;
