import Hero from "@/components/Hero";
import About from "@/components/About";
import Products from "@/components/Products";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Products />
      <Benefits />
      <Footer />
    </main>
  );
};

export default Index;