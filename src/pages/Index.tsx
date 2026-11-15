import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import About from "@/components/About";
import BundlesSection from "@/components/BundlesSection";
import CollectionSection from "@/components/CollectionSection";
import Benefits from "@/components/Benefits";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  const { hash } = useLocation();

  // Lets links like "/#bundles" (the sale banner) land on the right section,
  // including when they are clicked from another page.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <main className="min-h-screen">
      <Hero />
      <VideoSection />
      <About />
      <BundlesSection />
      <CollectionSection />
      <Benefits />
      <Newsletter />
      <Footer />
    </main>
  );
};

export default Index;