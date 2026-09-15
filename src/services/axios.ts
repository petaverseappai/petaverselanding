import axios from "axios";
import { tokenStore } from "@/lib/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? "https://api.petaverseapp.com/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401, and not if this is already a retry or a
    // refresh/revoke request itself (avoid infinite loops).
    if (
      error.response?.status !== 401 ||
      original._retried ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/revoke")
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    // Deduplicate concurrent 401s — only one refresh call in flight at a time.
    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) {
          tokenStore.clear();
          window.location.href = "/admin/login";
          return;
        }
        try {
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken },
          );
          tokenStore.set(data.accessToken, data.refreshToken);
        } catch {
          tokenStore.clear();
          window.location.href = "/admin/login";
        }
      })().finally(() => {
        refreshing = null;
      });
    }

    await refreshing;

    // Retry original request with the new access token.
    const newToken = tokenStore.getAccess();
    if (!newToken) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
