import { MessageCircle, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-jump-rope.jpg";

const Hero = () => {
  const handleWhatsAppClick = () => {
    // Replace with your friend's actual WhatsApp business number
    const whatsappNumber = "1234567890"; // Update this number
    const message = "Hi! I'm interested in your jump ropes from Revive.";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-glow rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent rounded-full blur-3xl opacity-20 animate-pulse-glow" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-32 flex flex-col lg:flex-row items-center min-h-screen">
        {/* Content */}
        <div className="flex-1 text-center lg:text-left mb-12 lg:mb-0">
          {/* Brand Logo/Name */}
          <div className="mb-8 bounce-in">
            <h1 className="text-7xl lg:text-8xl font-black text-white mb-4 tracking-tight">
              REVIVE
            </h1>
            <p className="text-2xl lg:text-3xl font-semibold text-white/90 mb-2">
              Jump Into Fitness
            </p>
            <div className="w-24 h-1 bg-accent mx-auto lg:mx-0 rounded-full" />
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight bounce-in">
            Transform Your Workout with <span className="text-accent">Premium Jump Ropes</span>
          </h2>

          {/* Subheading */}
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Discover the perfect blend of quality, performance, and style. Our expertly crafted jump ropes are designed to elevate your fitness journey and help you achieve your goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
            <button
              onClick={handleWhatsAppClick}
              className="btn-hero flex items-center justify-center gap-3 group"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Chat with Us</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="btn-secondary bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30">
              View Collection
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-white/60">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Premium</div>
              <div className="text-sm">Quality Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm">Customer Support</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Element */}
        <div className="flex-1 lg:flex-none lg:w-96 flex justify-center">
          <div className="relative">
            <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-float">
              <div className="text-8xl animate-bounce-in">🪢</div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white font-bold text-lg animate-pulse-glow">
              NEW
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Scroll to explore</span>
          <ArrowRight className="w-5 h-5 rotate-90" />
        </div>
      </div>
    </section>
  );
};

export default Hero;