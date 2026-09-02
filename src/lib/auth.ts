const ACCESS_KEY = "pv_access_token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(ACCESS_KEY),
  set: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  clear: () => localStorage.removeItem(ACCESS_KEY),
};
