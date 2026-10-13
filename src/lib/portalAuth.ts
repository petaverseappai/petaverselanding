const PORTAL_ACCESS_KEY = "pv_portal_access_token";

export const portalTokenStore = {
  getAccess: (): string | null => localStorage.getItem(PORTAL_ACCESS_KEY),
  set: (access: string) => {
    localStorage.setItem(PORTAL_ACCESS_KEY, access);
  },
  clear: () => {
    localStorage.removeItem(PORTAL_ACCESS_KEY);
  },
};
