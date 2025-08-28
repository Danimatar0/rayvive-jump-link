import { Heart, Target, Zap, Award } from "lucide-react";

const About = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Why Choose <span className="text-primary">Revive?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're passionate about creating the finest jump ropes that combine traditional craftsmanship 
            with modern innovation to help you achieve your fitness goals.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h3 className="text-3xl font-bold text-foreground mb-6">Our Story</h3>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Revive was born from a simple belief: everyone deserves access to high-quality fitness equipment 
              that makes working out enjoyable and effective. Our founder discovered the transformative power 
              of jump rope training and wanted to share that experience with the world.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every rope we create is carefully designed and tested to ensure it meets the highest standards 
              of durability, performance, and style. We're not just selling equipment – we're helping you 
              revive your passion for fitness.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-2xl border hover:shadow-lg transition-shadow">
              <Heart className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Passion Driven</h4>
              <p className="text-muted-foreground">Built with love for fitness enthusiasts</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border hover:shadow-lg transition-shadow">
              <Target className="w-12 h-12 text-secondary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Goal Focused</h4>
              <p className="text-muted-foreground">Designed to help you achieve results</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border hover:shadow-lg transition-shadow">
              <Zap className="w-12 h-12 text-accent mb-4" />
              <h4 className="text-xl font-semibold mb-2">High Performance</h4>
              <p className="text-muted-foreground">Maximum efficiency in every workout</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border hover:shadow-lg transition-shadow">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Premium Quality</h4>
              <p className="text-muted-foreground">Uncompromising standards in materials</p>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-energy-gradient rounded-3xl p-12 text-center text-white">
          <h3 className="text-4xl font-bold mb-6">Our Mission</h3>
          <p className="text-xl leading-relaxed max-w-4xl mx-auto">
            To revive the joy of fitness through innovative, high-quality jump ropes that empower people 
            to achieve their health and wellness goals while having fun in the process.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;