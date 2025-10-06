import { 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin,
  Heart 
} from "lucide-react";

const Footer = () => {
  const handleWhatsAppClick = () => {
    const message = "Hi! I have a question about Rayvive jump ropes. Can you help me?";
    const whatsappNumber = "96181807324";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSocialClick = (platform: string) => {
    // Replace these with actual social media handles
    const urls = {
      instagram: "https://instagram.com/revive_jumpropes", // Update these URLs
      facebook: "https://facebook.com/revive.jumpropes",
      twitter: "https://twitter.com/revive_fitness"
    };
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <h3 className="text-4xl font-black mb-4">RAYVIVE</h3>
              <p className="text-lg text-background/80 mb-8 max-w-md leading-relaxed">
                Transforming fitness journeys with premium jump ropes designed for performance, 
                durability, and style. Your path to better health starts here.
              </p>
              
              {/* Contact CTA */}
              <button
                onClick={handleWhatsAppClick}
                className="btn-energy flex items-center gap-3 group mb-6"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Chat with Us Now</span>
              </button>

              {/* Social Media */}
              <div className="flex items-center gap-4">
                <span className="text-background/60">Follow us:</span>
                <button
                  onClick={() => handleSocialClick('instagram')}
                  className="w-12 h-12 bg-background/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleSocialClick('facebook')}
                  className="w-12 h-12 bg-background/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Facebook className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleSocialClick('twitter')}
                  className="w-12 h-12 bg-background/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <button className="text-background/80 hover:text-primary transition-colors text-left">
                    Our Story
                  </button>
                </li>
                <li>
                  <button className="text-background/80 hover:text-primary transition-colors text-left">
                    Products
                  </button>
                </li>
                <li>
                  <button className="text-background/80 hover:text-primary transition-colors text-left">
                    Benefits
                  </button>
                </li>
                <li>
                  <button className="text-background/80 hover:text-primary transition-colors text-left">
                    Customer Reviews
                  </button>
                </li>
                <li>
                  <button className="text-background/80 hover:text-primary transition-colors text-left">
                    Workout Tips
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-bold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-background/80">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>WhatsApp Business Chat</span>
                </div>
                <div className="flex items-center gap-3 text-background/80">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>hello@revivejumpropes.com</span>
                </div>
                <div className="flex items-center gap-3 text-background/80">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Available Nationwide</span>
                </div>
              </div>
              
              {/* Business Hours */}
              <div className="mt-8">
                <h5 className="font-semibold mb-3">Response Time</h5>
                <p className="text-background/80 text-sm">
                  We typically respond within 2 hours during business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-background/60 text-sm">
              © 2024 Rayvive Jump Ropes. All rights reserved.
            </div>
            
            <div className="flex items-center gap-2 text-background/60 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary" />
              <span>for fitness enthusiasts</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;