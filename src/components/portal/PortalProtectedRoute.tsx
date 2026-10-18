import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { usePortalPage } from "@/context/PortalPageContext";
import { getMyPage } from "@/services/portal";
import { ROUTES } from "@/constants/routes";

export function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePortalAuth();
  const { page, setPage } = usePortalPage();
  const [loading, setLoading] = useState(isAuthenticated && !page);
  const [noPage, setNoPage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || page) return;
    getMyPage()
      .then((p) => { setPage(p); setLoading(false); })
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNoPage(true);
        setLoading(false);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to={ROUTES.PORTAL_LOGIN} replace />;
  if (loading) return null;
  if (noPage) return <Navigate to={ROUTES.PORTAL_NO_PAGE} replace />;
  return <>{children}</>;
}
