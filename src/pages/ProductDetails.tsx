import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, CheckCircle, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const products: {
    [key: string]: {
      name: string;
      price: string;
      originalPrice?: string;
      image: string;
      features: string[];
      description: string;
      highlights: string[];
    };
  } = {
    "full-white": {
      name: "Full White",
      price: "$12.99",
      image: "🤍",
      features: ["Premium White Design", "Adjustable Length", "Smooth Rotation", "Beginner Friendly"],
      description: "Our classic Full White jump rope features a sleek, minimalist design perfect for any workout environment. The pristine white color adds elegance to your fitness routine while the adjustable length ensures a perfect fit for users of all heights.",
      highlights: [
        "Durable PVC-coated cable",
        "Comfortable foam handles",
        "Adjustable from 7ft to 10ft",
        "Lightweight at only 4oz",
        "Smooth 360° rotation",
        "Perfect for cardio and endurance"
      ]
    },
    "dotted": {
      name: "Dotted",
      price: "$14.99",
      image: "⚪",
      features: ["Unique Dotted Pattern", "Enhanced Grip", "Weighted Design", "Pro Performance"],
      description: "The Dotted rope combines style with functionality, featuring a unique pattern for enhanced visibility during workouts. The slightly weighted design provides better control and feedback, making it ideal for speed training and double-unders.",
      highlights: [
        "Distinctive dotted pattern design",
        "Weighted cable for better control",
        "Enhanced visibility during workouts",
        "Professional-grade ball bearings",
        "Ergonomic grip handles",
        "Ideal for CrossFit and HIIT"
      ]
    },
    "combo-package": {
      name: "Combo Package",
      price: "$24.99",
      originalPrice: "$27.98",
      image: "📦",
      features: ["Both Ropes Included", "Save $3", "Complete Training Set", "Best Value"],
      description: "Get both the Full White and Dotted ropes in one package. Perfect for variety in your training routine, this combo gives you everything you need to progress from beginner to advanced levels. Switch between styles based on your workout intensity and goals.",
      highlights: [
        "Includes Full White + Dotted ropes",
        "Save $3 with bundle discount",
        "Versatile training options",
        "Complete beginner to pro set",
        "Carrying pouch included",
        "Best value for serious athletes"
      ]
    }
  };

  const product = products[productId as keyof typeof products];

  if (!product) {
    navigate("/collection");
    return null;
  }

  const handleWhatsAppPurchase = () => {
    const message = `Hi! I'd like to finalize my purchase of the ${product.name} jump rope (${product.price}).

Please let me know the next steps for ordering!`;

    const whatsappNumber = "1234567890";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <button
            onClick={() => navigate("/collection")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Collection
          </button>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Product Image & Info */}
            <div className="bg-card rounded-3xl border p-12 text-center">
              <div className="text-8xl mb-6 animate-bounce-in">{product.image}</div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{product.name}</h1>
              
              <div className="mb-8">
                {product.originalPrice && (
                  <div className="text-xl text-muted-foreground line-through mb-2">
                    {product.originalPrice}
                  </div>
                )}
                <div className="text-5xl font-black text-primary">{product.price}</div>
              </div>

              {/* Quick Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="bg-muted/30 p-4 rounded-2xl">
                    <Star className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-sm font-medium text-foreground">{feature}</div>
                  </div>
                ))}
              </div>

              {/* Purchase Button */}
              <button 
                onClick={handleWhatsAppPurchase}
                className="btn-energy w-full flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Click here to finalize your purchase (you will be redirected to WhatsApp)</span>
              </button>
            </div>

            {/* Description & Highlights */}
            <div className="space-y-8">
              {/* Description */}
              <div className="bg-card rounded-3xl border p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">About This Product</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="bg-card rounded-3xl border p-8">
                <h2 className="text-3xl font-bold text-foreground mb-6">Key Highlights</h2>
                <ul className="space-y-4">
                  {product.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <span className="text-lg text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Guarantee */}
              <div className="bg-primary/10 rounded-3xl border border-primary/20 p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Guarantee</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>30-day satisfaction guarantee</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Lifetime customer support</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Quality craftsmanship</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ProductDetails;
