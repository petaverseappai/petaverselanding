import { createContext, useContext, useState, useCallback } from "react";
import type { MyPage } from "@/types/portal.types";

interface PortalPageContextValue {
  page: MyPage | null;
  setPage: (page: MyPage) => void;
  clearPage: () => void;
}

const PortalPageContext = createContext<PortalPageContextValue | null>(null);

export function PortalPageProvider({ children }: { children: React.ReactNode }) {
  const [page, setPageState] = useState<MyPage | null>(null);

  const setPage = useCallback((p: MyPage) => setPageState(p), []);
  const clearPage = useCallback(() => setPageState(null), []);

  return (
    <PortalPageContext.Provider value={{ page, setPage, clearPage }}>
      {children}
    </PortalPageContext.Provider>
  );
}

export function usePortalPage(): PortalPageContextValue {
  const ctx = useContext(PortalPageContext);
  if (!ctx) throw new Error("usePortalPage must be used within PortalPageProvider");
  return ctx;
}

export function usePageId(): number {
  const { page } = usePortalPage();
  if (!page) throw new Error("No page loaded");
  return page.id;
}
