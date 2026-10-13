import { createContext, useContext, useState, useCallback } from "react";
import { portalTokenStore } from "@/lib/portalAuth";
import { revokeToken } from "@/services/admin";

interface PortalAuthContextValue {
  isAuthenticated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!portalTokenStore.getAccess());

  const login = useCallback((accessToken: string) => {
    portalTokenStore.set(accessToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    revokeToken().catch(() => {});
    portalTokenStore.clear();
    setIsAuthenticated(false);
  }, []);

  return (
    <PortalAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
