import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, ScrollRestoration } from "react-router-dom";
import Index from "./pages/Index";
import Collection from "./pages/Collection";
import ProductDetails from "./pages/ProductDetails";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AnalyticsProvider from './components/AnalyticsProvider';
import CookieConsent from './components/CookieConsent';

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  // No basename needed for custom domain!
  // const basename = import.meta.env.PROD ? '/rayvive-jump-link' : '';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>  {/* ← Remove basename prop */}
          <AnalyticsProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/product/:productId" element={<ProductDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
