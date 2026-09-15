import { createContext, useContext, useState, useCallback } from "react";
import { tokenStore } from "@/lib/auth";
import { revokeToken } from "@/services/admin";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!tokenStore.getAccess());

  const login = useCallback((accessToken: string, refreshToken: string) => {
    tokenStore.set(accessToken, refreshToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    const refresh = tokenStore.getRefresh();
    // Fire-and-forget revoke — clear locally regardless of server response.
    if (refresh) revokeToken(refresh).catch(() => {});
    tokenStore.clear();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
