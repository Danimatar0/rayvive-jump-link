import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import About from "@/components/About";
import CollectionSection from "@/components/CollectionSection";
import Benefits from "@/components/Benefits";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <VideoSection />
      <About />
      <CollectionSection />
      <Benefits />
      <Newsletter />
      <Footer />
    </main>
  );
};

export default Index;