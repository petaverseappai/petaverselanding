import { api } from "@/services/axios";
import type { AuthResponse } from "@/types/auth.types";
import type { WaitlistResponse } from "@/types/admin.types";

export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/admin-login", { email, password });
  return data;
}

export async function getWaitlist(): Promise<WaitlistResponse> {
  const { data } = await api.get<WaitlistResponse>("/waitlist");
  return data;
}
