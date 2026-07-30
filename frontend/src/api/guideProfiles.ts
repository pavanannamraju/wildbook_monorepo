import { apiFetch } from "./client";

export type GuideRole = "GUIDE" | "NATURALIST";

export type ReferenceItem = {
  id: string;
  name: string;
  description?: string | null;
};

export type GuideProfileOptions = {
  roles: GuideRole[];
  language_presets: string[];
  specialization_presets: string[];
  focus_areas: ReferenceItem[];
  certifications: ReferenceItem[];
  max_profile_photo_bytes: number;
  allowed_profile_photo_content_types: string[];
};

export type NaturalistProfileInput = {
  focus_area_ids: string[];
  certification_ids: string[];
  summary?: string;
};

export type CreateGuideProfileInput = {
  full_name: string;
  email: string;
  role: GuideRole;
  base_location: string;
  languages: string[];
  specializations: string[];
  years_of_experience: number;
  bio?: string;
  naturalist_profile?: NaturalistProfileInput;
  profile_photo_content_type?: string;
  profile_photo_base64?: string;
};

export type GuideProfileResponse = {
  id: string;
  full_name: string;
  email: string;
  role: GuideRole;
  has_profile_photo: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchGuideProfileOptions(signal?: AbortSignal): Promise<GuideProfileOptions> {
  const response = await apiFetch("/api/v1/guide-profiles/options", { signal });
  if (!response.ok) {
    throw new Error(`Failed to load guide profile options (HTTP ${response.status}).`);
  }
  return response.json() as Promise<GuideProfileOptions>;
}

export async function createGuideProfile(
  input: CreateGuideProfileInput,
  signal?: AbortSignal,
): Promise<GuideProfileResponse> {
  const response = await apiFetch("/api/v1/guide-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to save guide profile (HTTP ${response.status}).`);
  }
  return response.json() as Promise<GuideProfileResponse>;
}
