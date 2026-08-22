/**
 * Admin session state.
 *
 * The token here is only a *carrier* — it grants nothing on its own. It was
 * signed by the Apps Script with a secret that never leaves the server, and
 * every admin request is re-verified there. Tampering with this value, or
 * setting one by hand, yields UNAUTHORIZED.
 *
 * Stored in sessionStorage rather than localStorage so the session dies with
 * the tab; the server-side token additionally expires after 12 hours.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminLogin } from "@/lib/ordersApi";

const TOKEN_KEY = "rayvive_admin_token";

interface AdminAuthValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  /** Clears the session after the server rejects a token as expired. */
  handleUnauthorized: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);

  const login = useCallback(async (password: string) => {
    const { token: issued } = await adminLogin(password);
    try {
      sessionStorage.setItem(TOKEN_KEY, issued);
    } catch {
      // Session still works in memory for this page load.
    }
    setToken(issued);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore — clearing state below is what matters.
    }
    setToken(null);
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
      handleUnauthorized: logout,
    }),
    [token, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside an AdminAuthProvider");
  return context;
}
