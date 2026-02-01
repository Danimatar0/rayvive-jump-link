import {
  Heart,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

const Benefits = () => {
  const handleTransformationClick = () => {
    const message = `🚀 I'm ready to transform my fitness journey with Rayvive jump ropes!

💪 I just learned that jump ropes can burn up to 1000 calories per hour - that's incredible!

I'd love to get:
✅ Personalized rope recommendations
✅ Expert workout tips to get started

Let's make fitness fun and effective together! When can we chat about the perfect rope for my goals? 🎯`;

    openWhatsApp(message);
  };

  const benefits = [
    {
      icon: Heart,
      title: "Cardiovascular Health",
      description: "Boost your heart health with high-intensity cardio that's more effective than running"
    },
    {
      icon: Zap,
      title: "Burns Calories Fast",
      description: "Burn up to 1000 calories per hour while having fun and building coordination"
    },
    {
      icon: Target,
      title: "Full Body Workout",
      description: "Engage your core, legs, arms, and shoulders in one comprehensive exercise"
    },
    {
      icon: Clock,
      title: "Time Efficient",
      description: "Get maximum results in minimal time - perfect for busy schedules"
    },
    {
      icon: TrendingUp,
      title: "Progressive Training",
      description: "Easily track your progress and increase intensity as you improve"
    },
    {
      icon: Users,
      title: "Suitable for All",
      description: "Perfect for beginners to professional athletes - adjust to your level"
    }
  ];

  const stats = [
    { number: "1000+", label: "Calories Burned/Hour" },
    { number: "15min", label: "Effective Workout" },
    { number: "100%", label: "Portable Fitness" },
    { number: "365", label: "Days Ready to Use" }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Why Jump Rope is the <span className="text-primary">Ultimate Workout</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the incredible benefits that make jump rope training one of the most effective 
            and enjoyable forms of exercise available.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-3xl border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transformation Section */}
        <div className="bg-energy-gradient rounded-3xl p-12 text-white text-center">
          <h3 className="text-4xl font-bold mb-6">Ready to Transform Your Fitness?</h3>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Join thousands of fitness enthusiasts who have discovered the power of jump rope training. 
            Your journey to better health starts with a single jump.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-6 h-6" />
              <span>Free consultations</span>
            </div>
          </div>
          
          <button
            onClick={handleTransformationClick}
            className="btn-hero bg-white text-primary hover:bg-white/90 mt-8 group flex items-center gap-3 mx-auto"
          >
            <span>Start Your Transformation</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Benefits;