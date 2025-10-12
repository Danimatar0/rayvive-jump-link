import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, CheckCircle, MessageCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Footer from "@/components/Footer";
import { createWhatsAppLink } from "@/config/constants";
import { useState } from "react";
import productsData from "@/data/products.json";
import novaWhiteImg from "@/assets/nova-white-img.jpeg";
import speedRopeNovaImg from "@/assets/speed-rope-nova-img.jpg";
import novaWhiteComparison from "@/assets/nova-white-comparison.jpg";
import aetherDottedDetailsImg from "@/assets/aether-dotted-details-img.jpeg";
import beadedRopeAetherImg from "@/assets/beaded-rope-aether-img.jpg";
import aetherComparison from "@/assets/aether-comparison.jpg";
import comboPackageDetailsImg from "@/assets/combo-package-details-img.jpeg";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = productsData[productId as keyof typeof productsData];

  if (!product) {
    navigate("/");
    return null;
  }

  const getProductDetailsImage = (imageFileName: string) => {
    const imageMap: Record<string, string> = {
      "nova-white-img.jpeg": novaWhiteImg,
      "speed-rope-nova-img.jpg": speedRopeNovaImg,
      "nova-white-comparison.jpg": novaWhiteComparison,
      "aether-dotted-details-img.jpeg": aetherDottedDetailsImg,
      "beaded-rope-aether-img.jpg": beadedRopeAetherImg,
      "aether-comparison.jpg": aetherComparison,
      "combo-package-details-img.jpeg": comboPackageDetailsImg,
    };
    return imageMap[imageFileName];
  };

  const productImages = product.detailsImages || [product.detailsImage];
  const hasMultipleImages = productImages.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handlePurchaseClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = () => {
    const message = `Hi! I'm interested in purchasing the ${product.name} for ${product.price}. Could you please assist me with the order?`;
    const whatsappUrl = createWhatsAppLink(message);
    window.open(whatsappUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <button
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                const element = document.getElementById('collection');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
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
              {/* Image Carousel */}
              <div className="relative mb-6">
                {productImages[currentImageIndex] ? (
                  <img
                    src={getProductDetailsImage(productImages[currentImageIndex])}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-96 object-contain rounded-2xl"
                  />
                ) : (
                  <div className="text-8xl mb-6 animate-bounce-in">{product.image}</div>
                )}

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors border border-border"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors border border-border"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6 text-foreground" />
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {productImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-primary w-6'
                            : 'bg-background/60 hover:bg-background/80'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-bold text-foreground mb-4">{product.name}</h1>
              
              <div className="mb-8">
                {product.price && (
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
                onClick={handlePurchaseClick}
                className="btn-energy w-full flex items-center justify-center gap-3 text-lg py-4"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Order Now</span>
                <ExternalLink className="w-5 h-5" />
              </button>

              <p className="text-center text-sm text-muted-foreground mt-3">
                Secure ordering via WhatsApp Business
              </p>
            </div>

            {/* Description & Highlights */}
            <div className="space-y-8">
              {/* Description */}
              <div className="bg-card rounded-3xl border p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">About This Product</h2>
                <div className="text-lg text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
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
                  {/* <div className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>30-day satisfaction guarantee</span>
                  </div> */}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl border max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Complete Your Order
              </h3>
              <p className="text-muted-foreground">
                You'll be redirected to WhatsApp to finalize your purchase of the{" "}
                <span className="font-semibold text-foreground">{product.name}</span> for{" "}
                <span className="font-semibold text-primary">{product.price}</span>.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmPurchase}
                className="btn-energy w-full flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Continue to WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowConfirmDialog(false)}
                className="w-full py-3 px-4 rounded-2xl border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                🔒 Secure ordering • Fast response • Fast delivery
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
};

export default ProductDetails;
