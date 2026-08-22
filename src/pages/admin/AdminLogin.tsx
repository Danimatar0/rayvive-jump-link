import { useState } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { OrdersApiError, isOrdersApiConfigured } from "@/lib/ordersApi";

/**
 * Login gate for the admin area.
 *
 * This form does not decide anything — it forwards the password to the Apps
 * Script, which holds the real secret and returns a signed token only on a
 * match. Bypassing this component in the browser gets you an empty dashboard,
 * because every data call is authorised server-side.
 */
const AdminLogin = () => {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(password);
    } catch (err) {
      setError(
        err instanceof OrdersApiError
          ? err.message
          : "Could not sign in. Please try again."
      );
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-card border rounded-3xl p-8">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Rayvive Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to view your orders
            </p>
          </div>

          {!isOrdersApiConfigured() && (
            <div className="mb-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <code>VITE_ORDERS_API_URL</code> is not set, so login cannot reach the server.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            {error && (
              <div role="alert" className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="btn-energy w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
