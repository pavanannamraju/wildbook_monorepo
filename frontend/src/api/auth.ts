import { apiFetch } from "./client";

export type EmailSignupProfileInput = {
  full_name: string;
  phone_number?: string;
};

export type UserRole = "USER" | "ADMIN" | "GUIDE";
export type AuthProviderType = "EMAIL" | "GOOGLE";
export type TravelExperienceLevel = "beginner" | "intermediate" | "advanced";
export type AvatarType = "preset" | "custom";

export type CurrentUser = {
  id: string;
  uid: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  profile_completed: boolean;
  auth_provider: AuthProviderType;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  location_city: string | null;
  location_country: string | null;
  interests: string[];
  preferred_languages: string[];
  experience_level: TravelExperienceLevel | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  /** Differentiator: "preset" wildlife icon vs "custom" uploaded photo. */
  avatar_type: AvatarType | null;
  /** Preset icon key, e.g. "019-tiger". Null when avatar_type is "custom". */
  avatar_key: string | null;
  /** Hosted photo URL when avatar_type is "custom". */
  avatar_url: string | null;
};

export type ProfileDetailsInput = {
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  location_city?: string;
  location_country?: string;
  interests: string[];
  preferred_languages: string[];
  experience_level?: TravelExperienceLevel;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  phone_number?: string;
};

export type AvatarUpdateInput = {
  avatar_type: AvatarType;
  avatar_key?: string;
  avatar_url?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseExperienceLevel(value: unknown): TravelExperienceLevel | null {
  return value === "beginner" || value === "intermediate" || value === "advanced" ? value : null;
}

function parseAvatarType(value: unknown): AvatarType | null {
  return value === "preset" || value === "custom" ? value : null;
}

function parseCurrentUser(payload: unknown): CurrentUser {
  if (!isRecord(payload) || typeof payload.id !== "string" || typeof payload.email !== "string") {
    throw new Error("Unexpected current user response.");
  }
  return {
    id: payload.id,
    uid: typeof payload.uid === "string" ? payload.uid : "",
    email: payload.email,
    full_name: typeof payload.full_name === "string" ? payload.full_name : null,
    phone_number: typeof payload.phone_number === "string" ? payload.phone_number : null,
    role: payload.role === "ADMIN" || payload.role === "GUIDE" ? payload.role : "USER",
    is_active: Boolean(payload.is_active),
    profile_completed: Boolean(payload.profile_completed),
    auth_provider: payload.auth_provider === "GOOGLE" ? "GOOGLE" : "EMAIL",
    bio: typeof payload.bio === "string" ? payload.bio : null,
    date_of_birth: typeof payload.date_of_birth === "string" ? payload.date_of_birth : null,
    gender: typeof payload.gender === "string" ? payload.gender : null,
    location_city: typeof payload.location_city === "string" ? payload.location_city : null,
    location_country: typeof payload.location_country === "string" ? payload.location_country : null,
    interests: parseStringArray(payload.interests),
    preferred_languages: parseStringArray(payload.preferred_languages),
    experience_level: parseExperienceLevel(payload.experience_level),
    emergency_contact_name: typeof payload.emergency_contact_name === "string" ? payload.emergency_contact_name : null,
    emergency_contact_phone:
      typeof payload.emergency_contact_phone === "string" ? payload.emergency_contact_phone : null,
    avatar_type: parseAvatarType(payload.avatar_type),
    avatar_key: typeof payload.avatar_key === "string" ? payload.avatar_key : null,
    avatar_url: typeof payload.avatar_url === "string" ? payload.avatar_url : null,
  };
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/auth/me", { signal });
  if (!response.ok) {
    throw new Error(`Failed to load profile (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseCurrentUser(json);
}

export async function upsertEmailSignupProfile(
  payload: EmailSignupProfileInput,
  signal?: AbortSignal,
): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/auth/email-signup-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(errorPayload?.error?.message ?? `Failed to save profile (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseCurrentUser(json);
}

export async function updateProfileDetails(
  payload: ProfileDetailsInput,
  signal?: AbortSignal,
): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/auth/me/profile-details", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(errorPayload?.error?.message ?? `Failed to save profile details (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseCurrentUser(json);
}

export async function updateUserAvatar(
  payload: AvatarUpdateInput,
  signal?: AbortSignal,
): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/auth/me/avatar", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(errorPayload?.error?.message ?? `Failed to save avatar (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseCurrentUser(json);
}
