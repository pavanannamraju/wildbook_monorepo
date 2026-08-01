import { apiFetch } from "./client";

export type GuideProfessionOption = "Registered Forest Guide" | "Naturalist";

export type CreateGuideApplicationInput = {
  fullname: string;
  location: string;
  profession: GuideProfessionOption;
  contact_number: string;
  email: string;
};

export async function createGuideApplication(
  input: CreateGuideApplicationInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiFetch("/api/v1/guide-applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to submit guide application (HTTP ${response.status}).`);
  }
}
