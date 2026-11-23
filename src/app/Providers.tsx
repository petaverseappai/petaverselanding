import { AuthProvider } from "@/context/AuthContext";
import { PortalAuthProvider } from "@/context/PortalAuthContext";
import { PortalPageProvider } from "@/context/PortalPageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalAuthProvider>
        <PortalPageProvider>{children}</PortalPageProvider>
      </PortalAuthProvider>
    </AuthProvider>
  );
}
