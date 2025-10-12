import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import rayvive_in_action_mp4 from "@/assets/rayvive-in-action.mp4";

const VideoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            videoElement.play().catch((error) => {
              console.log("Autoplay prevented:", error);
            });
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            See <span className="text-primary">Rayvive</span> in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how our premium jump ropes can transform your fitness journey
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
            {/* Transparent overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
            
            {/* Video element */}
            <div className="relative aspect-video bg-muted/50 backdrop-blur-sm border-2 border-primary/20 rounded-3xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-90"
                loop
                muted
                playsInline
                preload="auto"
                poster="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=675&fit=crop"
              >
                <source src={rayvive_in_action_mp4} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Play indicator overlay */}
              {!isVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center animate-pulse">
                    <Play className="w-10 h-10 text-primary-foreground ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative border glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-xl group-hover:opacity-30 transition-opacity -z-10" />
          </div>

          {/* Video description
          <div className="text-center mt-8 text-muted-foreground">
            <p className="text-sm">
              🎥 Video automatically plays when you scroll to it
            </p>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
