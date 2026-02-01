import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { submitToGoogleSheets } from "@/lib/googleSheets";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255, { message: "Email is too long" }),
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name is too long" })
});

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Attempting to subscribe with:", { email, name });
    // Validate inputs
    try {
      emailSchema.parse({ email, name });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    console.log("Sending newsletter subscription to Google Sheets:", { email, name });

    try {
      await submitToGoogleSheets({
        name,
        email,
        timestamp: new Date().toISOString(),
        source: "Rayvive Website Newsletter"
      });

      setIsSubscribed(true);
      setEmail("");
      setName("");

      toast({
        title: "Successfully Subscribed! 🎉",
        description: "Thank you for joining our newsletter. Check your email soon!",
      });
    } catch (error) {
      console.error("Error subscribing:", error);

      const errorMessage = error instanceof Error && error.message.includes('not configured')
        ? "Please complete the Google Sheets setup to enable newsletter subscriptions."
        : "Please try again later or contact us directly.";

      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl border-2 border-primary/20 p-12 text-center shadow-2xl">
            {/* Icon */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {isSubscribed ? (
                <CheckCircle className="w-10 h-10 text-primary" />
              ) : (
                <Mail className="w-10 h-10 text-primary" />
              )}
            </div>

            {/* Heading */}
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Join Our <span className="text-primary">Fitness Community</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get exclusive workout tips, special offers, and be the first to know about new products. 
              No spam, just pure fitness inspiration!
            </p>

            {/* Form */}
            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-border focus:border-primary outline-none transition-colors bg-background text-foreground"
                    required
                    maxLength={100}
                    disabled={isLoading}
                  />
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-border focus:border-primary outline-none transition-colors bg-background text-foreground"
                    required
                    maxLength={255}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-energy w-full sm:w-auto px-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
                </button>
                <p className="text-sm text-muted-foreground mt-4">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            ) : (
              <div className="animate-fade-in">
                <p className="text-lg text-foreground font-semibold mb-4">
                  You're all set! 🎉
                </p>
                <p className="text-muted-foreground">
                  Check your inbox for a confirmation email.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl mb-2">💪</div>
                <h4 className="font-semibold text-foreground mb-1">Workout Tips</h4>
                <p className="text-sm text-muted-foreground">Expert training advice</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎁</div>
                <h4 className="font-semibold text-foreground mb-1">Exclusive Offers</h4>
                <p className="text-sm text-muted-foreground">Special subscriber deals</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-foreground mb-1">Early Access</h4>
                <p className="text-sm text-muted-foreground">Be first to know</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
