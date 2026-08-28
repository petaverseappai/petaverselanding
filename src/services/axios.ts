import axios from "axios";

// Points at PetsApp.Api. The landing page itself is static and doesn't call
// this yet — it's here so the first admin-portal agent (auth, pets, etc.)
// can import `api` instead of re-deriving the client.
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});
