import { apiFetch } from "./client";

export type EmailSignupProfileInput = {
  full_name: string;
  phone_number?: string;
};

export async function upsertEmailSignupProfile(
  payload: EmailSignupProfileInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiFetch("/api/v1/auth/email-signup-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to save signup profile (HTTP ${response.status}).`);
  }
}
