import type { ReactNode } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminLogin from "@/pages/admin/AdminLogin";

/**
 * Renders the login form instead of the admin UI when there is no session.
 *
 * This is a convenience gate, not the security boundary — the real protection
 * is that every admin request carries a server-signed token that the Apps
 * Script verifies before returning a single row of order data.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <>{children}</> : <AdminLogin />;
};

export default RequireAdmin;
