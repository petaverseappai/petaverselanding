import axios from "axios";
import { tokenStore } from "@/lib/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? "http://petaverse.runasp.net/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
