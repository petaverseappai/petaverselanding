import { AuthProvider } from "@/context/AuthContext";
import { PortalAuthProvider } from "@/context/PortalAuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalAuthProvider>{children}</PortalAuthProvider>
    </AuthProvider>
  );
}
