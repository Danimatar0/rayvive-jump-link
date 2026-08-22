import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Collection from "./pages/Collection";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AnalyticsProvider from './components/AnalyticsProvider';
import CookieConsent from './components/CookieConsent';
import SiteHeader from './components/SiteHeader';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { captureAttribution } from './lib/attribution';

/**
 * The admin dashboard is loaded on demand. Customers arriving from a Meta ad
 * never open /orders, so keeping it out of the main bundle makes the pages
 * that matter for conversion smaller and faster.
 */
const Orders = lazy(() => import("./pages/admin/Orders"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const RequireAdmin = lazy(() => import("./pages/admin/RequireAdmin"));

const queryClient = new QueryClient();

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    Loading…
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * Records UTM / fbclid parameters on arrival so the order written to Google
 * Sheets can be traced back to the ad that produced it. Keyed on the query
 * string, because that is what carries campaign data.
 */
const AttributionTracker = () => {
  const { search } = useLocation();

  useEffect(() => {
    captureAttribution();
  }, [search]);

  return null;
};

/** The storefront header, hidden on the admin area which has its own chrome. */
const StorefrontHeader = () => {
  const { pathname } = useLocation();
  if (pathname === "/orders" || pathname.startsWith("/orders/")) return null;
  return <SiteHeader />;
};

const App = () => {
  // No basename needed for custom domain!

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartProvider>
            <AdminAuthProvider>
              <AnalyticsProvider>
                <ScrollToTop />
                <AttributionTracker />
                <StorefrontHeader />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/product/:productId" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route
                    path="/orders"
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <RequireAdmin>
                          <Orders />
                        </RequireAdmin>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/orders/:orderId"
                    element={
                      <Suspense fallback={<AdminFallback />}>
                        <RequireAdmin>
                          <OrderDetail />
                        </RequireAdmin>
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CookieConsent />
              </AnalyticsProvider>
            </AdminAuthProvider>
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
