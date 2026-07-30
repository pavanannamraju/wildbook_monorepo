import { apiFetch } from "./client";

export type ProviderRef = {
  type: "expert" | "provider";
  id: string;
};

export type GalleryMedia = {
  media_url: string;
  media_type: "image" | "video";
  caption?: string | null;
  sort_order: number;
};

export type AccommodationDetail = {
  id: string;
  slug: string;
  name: string;
  provider_ref: ProviderRef;
  expert_id?: string | null;
  expert_slug?: string | null;
  primary_location_id: string;
  address_line?: string | null;
  map_url?: string | null;
  about?: string | null;
  what_to_expect: string[];
  amenity_names: string[];
  gallery_media: GalleryMedia[];
  cancellation_policy?: string | null;
  house_rules: string[];
  safety_notes: string[];
  checkin_time?: string | null;
  checkout_time?: string | null;
  base_rate_amount?: number | null;
  currency: string;
  pricing_per: string;
  default_tax_rate_pct?: number | null;
  rating_avg?: number | null;
  reviews_count?: number | null;
  type?: string | null;
  rating?: {
    average?: number | null;
    reviews_count?: number | null;
    detailed?: {
      overall?: number | null;
      cleanliness?: number | null;
      amenities?: number | null;
      check_in?: number | null;
      access?: number | null;
      location?: number | null;
      value?: number | null;
    } | null;
  } | null;
  location?: {
    name?: string | null;
    state?: string | null;
    country?: string | null;
    description?: string | null;
  } | null;
  host?: {
    name?: string | null;
    role?: string | null;
    experience_years?: number | null;
  } | null;
  description?: {
    summary?: string | null;
    details?: string | null;
    experience_type?: string | null;
  } | null;
  room_details?: {
    room_type?: string | null;
    bathroom?: string | null;
    features: string[];
  } | null;
  capacity?: {
    group_size?: number | null;
    age_restriction?: string | null;
  } | null;
  amenities?: string[];
  experiences?: string[];
  pricing?: {
    price_per_person_per_night?: number | null;
    duration_nights?: number | null;
    base_cost?: number | null;
    taxes?: number | null;
    total_cost?: number | null;
    currency?: string | null;
  } | null;
  policies?: {
    cancellation?: {
      free_cancellation?: string | null;
      partial_refund?: string | null;
    } | null;
    check_in?: string | null;
    check_out?: string | null;
    house_rules: string[];
    safety: string[];
  } | null;
  highlights?: string[];
  booking?: {
    confirmation?: string | null;
    cancellation_window_hours?: number | null;
  } | null;
  images?: Array<{
    id: string;
    url: string;
    type?: string | null;
    category?: string | null;
    caption?: string | null;
    is_primary?: boolean;
    order?: number;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAccommodationDetail(payload: unknown): AccommodationDetail {
  if (!isRecord(payload)) {
    throw new Error("Unexpected accommodation response: expected object.");
  }
  if (typeof payload.id !== "string" || typeof payload.slug !== "string" || typeof payload.name !== "string") {
    throw new Error("Unexpected accommodation response: missing required fields.");
  }

  const providerRef = isRecord(payload.provider_ref)
    ? {
        type: payload.provider_ref.type === "provider" ? "provider" : "expert",
        id: typeof payload.provider_ref.id === "string" ? payload.provider_ref.id : "",
      }
    : { type: "expert" as const, id: "" };

  return {
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    provider_ref: providerRef,
    expert_id: typeof payload.expert_id === "string" ? payload.expert_id : null,
    expert_slug: typeof payload.expert_slug === "string" ? payload.expert_slug : null,
    primary_location_id: typeof payload.primary_location_id === "string" ? payload.primary_location_id : "",
    address_line: typeof payload.address_line === "string" ? payload.address_line : null,
    map_url: typeof payload.map_url === "string" ? payload.map_url : null,
    about: typeof payload.about === "string" ? payload.about : null,
    what_to_expect: Array.isArray(payload.what_to_expect)
      ? payload.what_to_expect.filter((v): v is string => typeof v === "string")
      : [],
    amenity_names: Array.isArray(payload.amenity_names)
      ? payload.amenity_names.filter((v): v is string => typeof v === "string")
      : [],
    gallery_media: Array.isArray(payload.gallery_media) ? (payload.gallery_media as GalleryMedia[]) : [],
    cancellation_policy: typeof payload.cancellation_policy === "string" ? payload.cancellation_policy : null,
    house_rules: Array.isArray(payload.house_rules)
      ? payload.house_rules.filter((v): v is string => typeof v === "string")
      : [],
    safety_notes: Array.isArray(payload.safety_notes)
      ? payload.safety_notes.filter((v): v is string => typeof v === "string")
      : [],
    checkin_time: typeof payload.checkin_time === "string" ? payload.checkin_time : null,
    checkout_time: typeof payload.checkout_time === "string" ? payload.checkout_time : null,
    base_rate_amount: typeof payload.base_rate_amount === "number" ? payload.base_rate_amount : null,
    currency: typeof payload.currency === "string" ? payload.currency : "INR",
    pricing_per: typeof payload.pricing_per === "string" ? payload.pricing_per : "person",
    default_tax_rate_pct: typeof payload.default_tax_rate_pct === "number" ? payload.default_tax_rate_pct : null,
    rating_avg: typeof payload.rating_avg === "number" ? payload.rating_avg : null,
    reviews_count: typeof payload.reviews_count === "number" ? payload.reviews_count : null,
    type: typeof payload.type === "string" ? payload.type : null,
    rating: isRecord(payload.rating)
      ? {
          average: typeof payload.rating.average === "number" ? payload.rating.average : null,
          reviews_count: typeof payload.rating.reviews_count === "number" ? payload.rating.reviews_count : null,
          detailed: isRecord(payload.rating.detailed)
            ? {
                overall: typeof payload.rating.detailed.overall === "number" ? payload.rating.detailed.overall : null,
                cleanliness: typeof payload.rating.detailed.cleanliness === "number" ? payload.rating.detailed.cleanliness : null,
                amenities: typeof payload.rating.detailed.amenities === "number" ? payload.rating.detailed.amenities : null,
                check_in: typeof payload.rating.detailed.check_in === "number" ? payload.rating.detailed.check_in : null,
                access: typeof payload.rating.detailed.access === "number" ? payload.rating.detailed.access : null,
                location: typeof payload.rating.detailed.location === "number" ? payload.rating.detailed.location : null,
                value: typeof payload.rating.detailed.value === "number" ? payload.rating.detailed.value : null,
              }
            : null,
        }
      : null,
    location: isRecord(payload.location)
      ? {
          name: typeof payload.location.name === "string" ? payload.location.name : null,
          state: typeof payload.location.state === "string" ? payload.location.state : null,
          country: typeof payload.location.country === "string" ? payload.location.country : null,
          description: typeof payload.location.description === "string" ? payload.location.description : null,
        }
      : null,
    host: isRecord(payload.host)
      ? {
          name: typeof payload.host.name === "string" ? payload.host.name : null,
          role: typeof payload.host.role === "string" ? payload.host.role : null,
          experience_years:
            typeof payload.host.experience_years === "number" ? payload.host.experience_years : null,
        }
      : null,
    description: isRecord(payload.description)
      ? {
          summary: typeof payload.description.summary === "string" ? payload.description.summary : null,
          details: typeof payload.description.details === "string" ? payload.description.details : null,
          experience_type:
            typeof payload.description.experience_type === "string" ? payload.description.experience_type : null,
        }
      : null,
    room_details: isRecord(payload.room_details)
      ? {
          room_type: typeof payload.room_details.room_type === "string" ? payload.room_details.room_type : null,
          bathroom: typeof payload.room_details.bathroom === "string" ? payload.room_details.bathroom : null,
          features: Array.isArray(payload.room_details.features)
            ? payload.room_details.features.filter((v): v is string => typeof v === "string")
            : [],
        }
      : null,
    capacity: isRecord(payload.capacity)
      ? {
          group_size: typeof payload.capacity.group_size === "number" ? payload.capacity.group_size : null,
          age_restriction:
            typeof payload.capacity.age_restriction === "string" ? payload.capacity.age_restriction : null,
        }
      : null,
    amenities: Array.isArray(payload.amenities)
      ? payload.amenities.filter((v): v is string => typeof v === "string")
      : [],
    experiences: Array.isArray(payload.experiences)
      ? payload.experiences.filter((v): v is string => typeof v === "string")
      : [],
    pricing: isRecord(payload.pricing)
      ? {
          price_per_person_per_night:
            typeof payload.pricing.price_per_person_per_night === "number"
              ? payload.pricing.price_per_person_per_night
              : null,
          duration_nights:
            typeof payload.pricing.duration_nights === "number" ? payload.pricing.duration_nights : null,
          base_cost: typeof payload.pricing.base_cost === "number" ? payload.pricing.base_cost : null,
          taxes: typeof payload.pricing.taxes === "number" ? payload.pricing.taxes : null,
          total_cost: typeof payload.pricing.total_cost === "number" ? payload.pricing.total_cost : null,
          currency: typeof payload.pricing.currency === "string" ? payload.pricing.currency : null,
        }
      : null,
    policies: isRecord(payload.policies)
      ? {
          cancellation: isRecord(payload.policies.cancellation)
            ? {
                free_cancellation:
                  typeof payload.policies.cancellation.free_cancellation === "string"
                    ? payload.policies.cancellation.free_cancellation
                    : null,
                partial_refund:
                  typeof payload.policies.cancellation.partial_refund === "string"
                    ? payload.policies.cancellation.partial_refund
                    : null,
              }
            : null,
          check_in: typeof payload.policies.check_in === "string" ? payload.policies.check_in : null,
          check_out: typeof payload.policies.check_out === "string" ? payload.policies.check_out : null,
          house_rules: Array.isArray(payload.policies.house_rules)
            ? payload.policies.house_rules.filter((v): v is string => typeof v === "string")
            : [],
          safety: Array.isArray(payload.policies.safety)
            ? payload.policies.safety.filter((v): v is string => typeof v === "string")
            : [],
        }
      : null,
    highlights: Array.isArray(payload.highlights)
      ? payload.highlights.filter((v): v is string => typeof v === "string")
      : [],
    booking: isRecord(payload.booking)
      ? {
          confirmation: typeof payload.booking.confirmation === "string" ? payload.booking.confirmation : null,
          cancellation_window_hours:
            typeof payload.booking.cancellation_window_hours === "number"
              ? payload.booking.cancellation_window_hours
              : null,
        }
      : null,
    images: Array.isArray(payload.images)
      ? payload.images
          .filter((image): image is Record<string, unknown> => isRecord(image))
          .map((image) => ({
            id: typeof image.id === "string" ? image.id : "",
            url: typeof image.url === "string" ? image.url : "",
            type: typeof image.type === "string" ? image.type : null,
            category: typeof image.category === "string" ? image.category : null,
            caption: typeof image.caption === "string" ? image.caption : null,
            is_primary: Boolean(image.is_primary),
            order: typeof image.order === "number" ? image.order : 0,
          }))
          .filter((image) => image.id.length > 0 && image.url.length > 0)
      : [],
  };
}

export async function fetchAccommodationById(slugOrId: string, signal?: AbortSignal): Promise<AccommodationDetail> {
  const response = await apiFetch(`/api/v1/accommodations/${encodeURIComponent(slugOrId)}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load accommodation details (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseAccommodationDetail(json);
}
