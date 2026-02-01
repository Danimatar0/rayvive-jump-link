import { useState } from "react";
import { Palette, Ruler, Grip, Sparkles, CheckCircle, MessageCircle } from "lucide-react";
import { openWhatsApp, WhatsAppMessages } from "@/lib/whatsapp";

const Customize = () => {
  const [selectedColor, setSelectedColor] = useState("black");
  const [selectedLength, setSelectedLength] = useState("standard");
  const [selectedHandle, setSelectedHandle] = useState("classic");

  const colors = [
    { id: "black", name: "Classic Black", color: "bg-slate-900" },
    { id: "red", name: "Energy Red", color: "bg-red-500" },
    { id: "blue", name: "Ocean Blue", color: "bg-blue-500" },
    { id: "green", name: "Forest Green", color: "bg-green-500" },
    { id: "purple", name: "Royal Purple", color: "bg-purple-500" },
    { id: "orange", name: "Sunset Orange", color: "bg-orange-500" }
  ];

  const lengths = [
    { id: "short", name: "Short (8ft)", description: "Perfect for kids and beginners", price: "+$0" },
    { id: "standard", name: "Standard (9ft)", description: "Most popular choice", price: "+$0" },
    { id: "long", name: "Long (10ft)", description: "For taller athletes", price: "+$5" }
  ];

  const handles = [
    { id: "classic", name: "Classic Foam", description: "Comfortable grip for all workouts", price: "+$0" },
    { id: "weighted", name: "Weighted Steel", description: "Extra resistance training", price: "+$15" },
    { id: "ergonomic", name: "Ergonomic Rubber", description: "Advanced grip technology", price: "+$10" }
  ];

  const basePrice = 39.99;
  const lengthPrice = selectedLength === "long" ? 5 : 0;
  const handlePrice = selectedHandle === "weighted" ? 15 : selectedHandle === "ergonomic" ? 10 : 0;
  const totalPrice = basePrice + lengthPrice + handlePrice;

  const handleWhatsAppOrder = () => {
    const orderDetails = WhatsAppMessages.customOrder(
      colors.find(c => c.id === selectedColor)?.name || '',
      lengths.find(l => l.id === selectedLength)?.name || '',
      handles.find(h => h.id === selectedHandle)?.name || '',
      `$${totalPrice.toFixed(2)}`
    );

    openWhatsApp(orderDetails);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Customize Your <span className="text-primary">Perfect Rope</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create a jump rope that's uniquely yours. Choose your color, length, and handle type 
            to match your style and fitness goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Customization Options */}
          <div className="space-y-8">
            {/* Color Selection */}
            <div className="bg-card p-8 rounded-3xl border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Choose Your Color</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                      selectedColor === color.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`w-12 h-12 ${color.color} rounded-xl mx-auto mb-3`} />
                    <div className="text-sm font-medium text-foreground">{color.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selection */}
            <div className="bg-card p-8 rounded-3xl border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Ruler className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Select Length</h3>
              </div>
              
              <div className="space-y-3">
                {lengths.map((length) => (
                  <button
                    key={length.id}
                    onClick={() => setSelectedLength(length.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                      selectedLength === length.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-foreground">{length.name}</div>
                        <div className="text-sm text-muted-foreground">{length.description}</div>
                      </div>
                      <div className="text-primary font-bold">{length.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Handle Selection */}
            <div className="bg-card p-8 rounded-3xl border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Grip className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Handle Type</h3>
              </div>
              
              <div className="space-y-3">
                {handles.map((handle) => (
                  <button
                    key={handle.id}
                    onClick={() => setSelectedHandle(handle.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                      selectedHandle === handle.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-foreground">{handle.name}</div>
                        <div className="text-sm text-muted-foreground">{handle.description}</div>
                      </div>
                      <div className="text-primary font-bold">{handle.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Order */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-card p-8 rounded-3xl border">
              {/* Preview */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-bold text-foreground">Your Custom Rope</h3>
                </div>
                
                {/* Visual Preview */}
                <div className="w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                  <div className="text-6xl">🪢</div>
                </div>

                {/* Selection Summary */}
                <div className="space-y-3 text-left bg-muted/30 p-6 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-semibold text-foreground">
                      {colors.find(c => c.id === selectedColor)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-semibold text-foreground">
                      {lengths.find(l => l.id === selectedLength)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Handle:</span>
                    <span className="font-semibold text-foreground">
                      {handles.find(h => h.id === selectedHandle)?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="text-4xl font-black text-primary mb-2">
                  ${totalPrice.toFixed(2)}
                </div>
                <div className="text-muted-foreground">Custom configuration price</div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Free recommendations</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Lifetime customer support</span>
                </div>
              </div>

              {/* Order Button */}
              <button 
                onClick={handleWhatsAppOrder}
                className="btn-energy w-full flex items-center justify-center gap-3 group"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Order via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Customize;