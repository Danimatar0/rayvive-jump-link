import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";
import { createWhatsAppLink } from "@/config/constants";
import { trackPixelEvent } from "@/lib/metaPixel";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import {
  describeVariant,
  getProduct,
  isPurchasable,
  isVariantSelectionComplete,
  maxQuantityFor,
  type VariantSelection,
} from "@/lib/catalog";
import { STORE, formatMoney } from "@/config/commerce";
import { shippingSummaryLabel } from "@/lib/shipping";
import {
  clearProductStructuredData,
  setCanonical,
  setDocumentTitle,
  setMetaDescription,
  setProductStructuredData,
  toPlainText,
} from "@/lib/seo";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [variant, setVariant] = useState<VariantSelection>({});
  const [quantity, setQuantity] = useState(1);

  const product = getProduct(productId);
  const viewContentFiredRef = useRef<string | null>(null);

  // Meta Pixel: product views are what Ads Manager builds retargeting audiences
  // from. The ref keys on the product id so switching products fires again,
  // but re-renders (choosing a colour, changing quantity) do not.
  useEffect(() => {
    if (!product || viewContentFiredRef.current === product.id) return;
    viewContentFiredRef.current = product.id;

    trackPixelEvent("ViewContent", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: STORE.currency,
    });
  }, [product]);

  // Per-product SEO: title, description, canonical and Product structured data.
  useEffect(() => {
    if (!product) return;

    setDocumentTitle(`${product.name} — Rayvive Jump Ropes`);
    setMetaDescription(toPlainText(product.description));
    setCanonical(product.url);
    setProductStructuredData({
      id: product.id,
      name: product.name,
      description: toPlainText(product.description, 300),
      image: product.images[0] ?? product.listImage,
      price: product.price,
      currency: product.currency,
      inStock: isPurchasable(product),
      path: product.url,
    });

    return () => clearProductStructuredData();
  }, [product]);

  // Reset selections when navigating between products.
  useEffect(() => {
    setVariant({});
    setQuantity(1);
    setCurrentImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (!product) navigate("/", { replace: true });
  }, [product, navigate]);

  if (!product) return null;

  const available = isPurchasable(product);
  const maxQuantity = maxQuantityFor(product);
  const hasVariants = product.variantGroups.length > 0;
  const variantsIncomplete = hasVariants && !isVariantSelectionComplete(product, variant);
  const canPurchase = available && !variantsIncomplete;

  const productImages = product.images;
  const hasMultipleImages = productImages.length > 1;

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);

  /**
   * Adds to the cart and fires AddToCart only on a successful add — a rejected
   * add (sold out, over the per-line cap) must not report a conversion.
   */
  const handleAddToCart = (): boolean => {
    const result = addItem(product, variant, quantity);

    if (!result.ok) {
      toast({
        title: "Couldn't add to cart",
        description: result.reason,
        variant: "destructive",
      });
      return false;
    }

    trackPixelEvent("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      contents: [{ id: product.id, quantity, item_price: product.price }],
      num_items: quantity,
      value: product.price * quantity,
      currency: STORE.currency,
    });

    return true;
  };

  const handleAddToCartClick = () => {
    if (handleAddToCart()) {
      const label = describeVariant(product, variant);
      toast({
        title: "Added to cart",
        description: `${product.name}${label ? ` (${label})` : ""} × ${quantity}`,
      });
    }
  };

  /** Buy Now: same add, then straight to checkout to cut friction for ad traffic. */
  const handleBuyNow = () => {
    if (handleAddToCart()) navigate("/checkout");
  };

  const whatsappHref = createWhatsAppLink(
    `Hi! I have a question about the ${product.name} jump rope.`
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-6">
          <button
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                document
                  .getElementById("collection")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            {/* Product Image & Purchase */}
            <div className="bg-card rounded-3xl border p-6 sm:p-12 text-center">
              {/* Image Carousel */}
              <div className="relative mb-6">
                {productImages[currentImageIndex] ? (
                  <img
                    src={productImages[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-80 sm:h-96 object-contain rounded-2xl"
                    width={600}
                    height={384}
                    // The first product image is the LCP element for ad traffic
                    // landing straight here, so it must not be lazy-loaded.
                    loading={currentImageIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <div className="text-8xl mb-6 animate-bounce-in">{product.emoji}</div>
                )}

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

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-primary w-6"
                              : "bg-background/60 hover:bg-background/80"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              <div className="mb-8">
                {product.originalPrice && (
                  <div className="text-xl text-muted-foreground line-through mb-2">
                    {formatMoney(product.originalPrice)}
                  </div>
                )}
                <div className="text-5xl font-black text-primary">
                  {formatMoney(product.price)}
                </div>
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

              {/* Variant pickers */}
              {hasVariants && available && (
                <div className="mb-8 text-left space-y-6">
                  {product.variantGroups.map((group) => (
                    <div key={group.id}>
                      <div className="text-sm font-semibold text-foreground mb-3">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {group.options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setVariant((prev) => ({ ...prev, [group.id]: option.id }))
                            }
                            aria-pressed={variant[group.id] === option.id}
                            className={`p-3 rounded-2xl border-2 transition-all hover:scale-105 ${
                              variant[group.id] === option.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full mx-auto mb-2 ${option.swatchClass ?? ""}`}
                            />
                            <div className="text-xs font-medium text-foreground text-center">
                              {option.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {variantsIncomplete && (
                    <p className="text-xs text-muted-foreground">
                      Choose an option from each group to continue.
                    </p>
                  )}
                </div>
              )}

              {/* Purchase */}
              {!available ? (
                <>
                  <button
                    disabled
                    aria-disabled="true"
                    className="w-full flex items-center justify-center gap-3 text-lg py-4 rounded-2xl font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <span>Sold Out</span>
                  </button>
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    This product is currently unavailable
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Quantity */}
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-sm font-medium text-foreground">Quantity</span>
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-semibold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                        disabled={quantity >= maxQuantity}
                        aria-label="Increase quantity"
                        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCartClick}
                    disabled={!canPurchase}
                    className={`btn-energy w-full flex items-center justify-center gap-3 text-lg py-4 ${
                      !canPurchase ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!canPurchase}
                    className={`w-full flex items-center justify-center gap-3 text-lg py-4 rounded-2xl font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${
                      !canPurchase ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span>Buy Now</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-1">
                    <Truck className="w-4 h-4" />
                    <span>Cash on delivery · {shippingSummaryLabel()}</span>
                  </div>

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackPixelEvent("Contact", { content_name: product.name })
                    }
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors pt-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Questions about this rope? Message us on WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Description & Highlights */}
            <div className="space-y-8">
              <div className="bg-card rounded-3xl border p-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">About This Product</h2>
                <div
                  className="text-lg text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>

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

              {/* How ordering works — sets expectations before checkout */}
              <div className="bg-card rounded-3xl border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">How ordering works</h2>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    Add your rope to the cart and check out — no account needed.
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    We call you to confirm your order and delivery time.
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    Pay in cash when it arrives. Delivery: {shippingSummaryLabel()}.
                  </li>
                </ol>
              </div>

              <div className="bg-primary/10 rounded-3xl border border-primary/20 p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">Our Guarantee</h3>
                <div className="space-y-3">
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

              <div className="text-center">
                <Link to="/cart" className="text-primary font-semibold hover:underline">
                  View your cart
                </Link>
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
