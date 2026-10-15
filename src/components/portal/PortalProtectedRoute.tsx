import { Navigate } from "react-router-dom";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { ROUTES } from "@/constants/routes";

export function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePortalAuth();
  if (!isAuthenticated) return <Navigate to={ROUTES.PORTAL_LOGIN} replace />;
  return <>{children}</>;
}
