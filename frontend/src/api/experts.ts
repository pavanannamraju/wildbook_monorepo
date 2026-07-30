import { apiFetch } from "./client";

export type ExperienceSnapshot = {
  id: string;
  title: string;
  type: string;
  status: string;
  rating?: number | null;
  reviews_count?: number | null;
  pricing_amount?: number | null;
  pricing_currency?: string | null;
  pricing_per?: string | null;
};

export type TestimonialSnapshot = {
  id: string;
  author_name: string;
  author_location?: string | null;
  content_excerpt: string;
  status: string;
};

export type ExpertSource = "local" | "catalog";

export type ExpertListItem = {
  id: string;
  slug: string;
  name: string;
  bio_summary?: string | null;
  location_primary_location_id?: string | null;
  location_name?: string | null;
  profile_image_url: string | null;
  source: ExpertSource;
  roles: string[];
  expertise_ids: string[];
  expertise_names: string[];
  language_ids: string[];
  language_names: string[];
  experience_snapshots: ExperienceSnapshot[];
  testimonial_snapshots: TestimonialSnapshot[];
  experience_rating_max?: number | null;
  is_bookmarked?: boolean | null;
};

export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
  total_count: number | null;
};

export type ExperienceDetail = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  duration?: { value: number; unit: string; flexible?: boolean } | null;
  group_size?: { min?: number | null; max?: number | null } | null;
  pricing?: { amount: number; currency: string; per: string } | null;
  reviews_count?: number | null;
  rating?: number | null;
};

export type TestimonialDetail = {
  id: string;
  author_name: string;
  author_location?: string | null;
  content: string;
};

export type FieldEntryDetail = {
  id: string;
  title: string;
  caption?: string | null;
  media_url: string;
  media_type: "image" | "video";
  sort_order: number;
  status: string;
  location_label?: string | null;
};

export type ExpertDetail = {
  id: string;
  slug: string;
  name: string;
  roles: string[];
  profile_image_url: string | null;
  source: ExpertSource;
  experience_years?: number | null;
  bio?: {
    summary: string;
    education?: string | null;
    career_transition?: string | null;
    philosophy?: string | null;
  } | null;
  location?: {
    primary_location_id: string;
    base_description?: string | null;
  } | null;
  location_name?: string | null;
  homestay?: {
    accommodation_id: string;
    slug: string;
    title: string;
    tagline?: string | null;
  } | null;
  expertise_ids: string[];
  expertise_names: string[];
  language_ids: string[];
  language_names: string[];
  experience_rating_max?: number | null;
  experiences_full?: ExperienceDetail[] | null;
  testimonials_full?: TestimonialDetail[] | null;
  field_entries_full?: FieldEntryDetail[] | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSource(value: unknown): ExpertSource {
  return value === "local" ? "local" : "catalog";
}

function resolveDisplayPhotoUrl(realUrl: unknown): string | null {
  if (typeof realUrl === "string" && realUrl) {
    return realUrl;
  }
  return null;
}

function parseExpert(item: unknown): ExpertListItem | null {
  if (!isRecord(item)) return null;
  if (typeof item.id !== "string") return null;
  if (typeof item.slug !== "string") return null;
  if (typeof item.name !== "string") return null;

  const source = parseSource(item.source);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    bio_summary: typeof item.bio_summary === "string" ? item.bio_summary : null,
    location_primary_location_id:
      typeof item.location_primary_location_id === "string"
        ? item.location_primary_location_id
        : null,
    location_name: typeof item.location_name === "string" ? item.location_name : null,
    profile_image_url: resolveDisplayPhotoUrl(item.profile_image_url),
    source,
    roles: Array.isArray(item.roles)
      ? item.roles.filter((v): v is string => typeof v === "string")
      : [],
    expertise_ids: Array.isArray(item.expertise_ids)
      ? item.expertise_ids.filter((v): v is string => typeof v === "string")
      : [],
    expertise_names: Array.isArray(item.expertise_names)
      ? item.expertise_names.filter((v): v is string => typeof v === "string")
      : [],
    language_ids: Array.isArray(item.language_ids)
      ? item.language_ids.filter((v): v is string => typeof v === "string")
      : [],
    language_names: Array.isArray(item.language_names)
      ? item.language_names.filter((v): v is string => typeof v === "string")
      : [],
    experience_snapshots: Array.isArray(item.experience_snapshots)
      ? (item.experience_snapshots as ExperienceSnapshot[])
      : [],
    testimonial_snapshots: Array.isArray(item.testimonial_snapshots)
      ? (item.testimonial_snapshots as TestimonialSnapshot[])
      : [],
    experience_rating_max:
      typeof item.experience_rating_max === "number" ? item.experience_rating_max : null,
    is_bookmarked: typeof item.is_bookmarked === "boolean" ? item.is_bookmarked : null,
  };
}

export function parseExpertsResponse(payload: unknown): CursorPage<ExpertListItem> {
  if (!isRecord(payload)) {
    throw new Error("Unexpected experts response: expected object.");
  }
  if (!Array.isArray(payload.items)) {
    throw new Error("Unexpected experts response: expected items array.");
  }

  const parsedItems = payload.items
    .map((item) => parseExpert(item))
    .filter((item): item is ExpertListItem => item !== null);

  return {
    items: parsedItems,
    next_cursor: typeof payload.next_cursor === "string" ? payload.next_cursor : null,
    total_count: typeof payload.total_count === "number" ? payload.total_count : null,
  };
}

export async function fetchExperts(
  params: {
    limit?: number;
    cursor?: string;
    status?: string;
    role?: "guide" | "naturalist" | "all";
    q?: string;
    includeBookmark?: boolean;
  } = {},
  signal?: AbortSignal,
): Promise<CursorPage<ExpertListItem>> {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? 24));
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.status) query.set("status", params.status);
  if (params.role && params.role !== "all") query.set("role", params.role);
  if (params.q && params.q.trim().length > 0) query.set("q", params.q.trim());
  if (params.includeBookmark) query.set("include_bookmark", "true");

  const response = await apiFetch(`/api/v1/experts?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load experts (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseExpertsResponse(json);
}

function parseExpertDetail(payload: unknown): ExpertDetail {
  if (!isRecord(payload)) {
    throw new Error("Unexpected expert detail response: expected object.");
  }
  if (typeof payload.id !== "string" || typeof payload.slug !== "string" || typeof payload.name !== "string") {
    throw new Error("Unexpected expert detail response: missing required fields.");
  }

  const source = parseSource(payload.source);

  return {
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    roles: Array.isArray(payload.roles)
      ? payload.roles.filter((v): v is string => typeof v === "string")
      : [],
    profile_image_url: resolveDisplayPhotoUrl(payload.profile_image_url),
    source,
    experience_years: typeof payload.experience_years === "number" ? payload.experience_years : null,
    bio: isRecord(payload.bio)
      ? {
          summary: typeof payload.bio.summary === "string" ? payload.bio.summary : "",
          education: typeof payload.bio.education === "string" ? payload.bio.education : null,
          career_transition:
            typeof payload.bio.career_transition === "string" ? payload.bio.career_transition : null,
          philosophy: typeof payload.bio.philosophy === "string" ? payload.bio.philosophy : null,
        }
      : null,
    location: isRecord(payload.location)
      ? {
          primary_location_id:
            typeof payload.location.primary_location_id === "string"
              ? payload.location.primary_location_id
              : "",
          base_description:
            typeof payload.location.base_description === "string"
              ? payload.location.base_description
              : null,
        }
      : null,
    expertise_ids: Array.isArray(payload.expertise_ids)
      ? payload.expertise_ids.filter((v): v is string => typeof v === "string")
      : [],
    expertise_names: Array.isArray(payload.expertise_names)
      ? payload.expertise_names.filter((v): v is string => typeof v === "string")
      : [],
    language_ids: Array.isArray(payload.language_ids)
      ? payload.language_ids.filter((v): v is string => typeof v === "string")
      : [],
    language_names: Array.isArray(payload.language_names)
      ? payload.language_names.filter((v): v is string => typeof v === "string")
      : [],
    location_name: typeof payload.location_name === "string" ? payload.location_name : null,
    homestay: isRecord(payload.homestay)
      ? {
          accommodation_id:
            typeof payload.homestay.accommodation_id === "string"
              ? payload.homestay.accommodation_id
              : "",
          slug: typeof payload.homestay.slug === "string" ? payload.homestay.slug : "",
          title: typeof payload.homestay.title === "string" ? payload.homestay.title : "",
          tagline: typeof payload.homestay.tagline === "string" ? payload.homestay.tagline : null,
        }
      : null,
    experience_rating_max:
      typeof payload.experience_rating_max === "number" ? payload.experience_rating_max : null,
    experiences_full: Array.isArray(payload.experiences_full)
      ? (payload.experiences_full as ExperienceDetail[])
      : [],
    testimonials_full: Array.isArray(payload.testimonials_full)
      ? (payload.testimonials_full as TestimonialDetail[])
      : [],
    field_entries_full: Array.isArray(payload.field_entries_full)
      ? (payload.field_entries_full as FieldEntryDetail[])
      : [],
  };
}

export async function fetchExpertById(
  slugOrId: string,
  signal?: AbortSignal,
): Promise<ExpertDetail> {
  const query = new URLSearchParams();
  query.append("include", "experiences_full");
  query.append("include", "testimonials_full");
  query.append("include", "field_entries_full");
  const response = await apiFetch(`/api/v1/experts/${encodeURIComponent(slugOrId)}?${query.toString()}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to load expert details (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseExpertDetail(json);
}

