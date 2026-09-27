const ACCESS_KEY = "pv_access_token";
const REFRESH_KEY = "pv_refresh_token";

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Returns true if the stored access token is missing, malformed, or past its exp claim.
// Applies a 30-second skew buffer to account for clock drift between client and server.
export function isAccessTokenExpired(): boolean {
  const token = tokenStore.getAccess();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp !== "number" || payload.exp - 30 < Date.now() / 1000;
  } catch {
    return true;
  }
}
