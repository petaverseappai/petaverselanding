import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isAccessTokenExpired, tokenStore } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || isAccessTokenExpired()) {
    // Clear stale tokens without firing a revoke API call (no active session to revoke).
    tokenStore.clear();
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  return <>{children}</>;
}
