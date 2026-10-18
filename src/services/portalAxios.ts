import axios from "axios";
import { portalTokenStore } from "@/lib/portalAuth";

export const portalApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? "https://api.petaverseapp.com/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

portalApi.interceptors.request.use((config) => {
  const token = portalTokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<void> | null = null;

portalApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original._retried ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/revoke")
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    if (!refreshing) {
      refreshing = (async () => {
        try {
          const { data } = await axios.post<{ accessToken: string }>(
            `${portalApi.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true },
          );
          portalTokenStore.set(data.accessToken);
        } catch {
          portalTokenStore.clear();
          window.location.href = "/portal/login";
        }
      })().finally(() => {
        refreshing = null;
      });
    }

    await refreshing;

    const newToken = portalTokenStore.getAccess();
    if (!newToken) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${newToken}`;
    return portalApi(original);
  },
);
