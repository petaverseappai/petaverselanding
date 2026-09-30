import { api } from "@/services/axios";

// ---------------------------------------------------------------------------
// Public password-reset endpoint (unauthenticated, email-link path)
// ---------------------------------------------------------------------------

export interface ResetPasswordResponse {
  message: string;
}

// Web/email path: identifies the user by userId + token, both taken from the
// reset link's query params. No mobile number required.
export async function resetPassword(body: {
  userId: string;
  token: string;
  newPassword: string;
}): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password", body);
  return data;
}
