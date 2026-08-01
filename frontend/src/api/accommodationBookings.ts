import { apiFetch } from "./client";

export type AccommodationBookingSummary = {
  id: string;
  accommodation_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  status: string;
  payment_status: string;
  currency: string;
  total_amount: number;
  created_at: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBookingSummary(item: unknown): AccommodationBookingSummary | null {
  if (!isRecord(item) || typeof item.id !== "string" || typeof item.accommodation_id !== "string") {
    return null;
  }
  const priceSnapshot = isRecord(item.price_snapshot) ? item.price_snapshot : {};
  return {
    id: item.id,
    accommodation_id: item.accommodation_id,
    check_in: typeof item.check_in === "string" ? item.check_in : "",
    check_out: typeof item.check_out === "string" ? item.check_out : "",
    adults: typeof item.adults === "number" ? item.adults : 1,
    status: typeof item.status === "string" ? item.status : "pending",
    payment_status: typeof item.payment_status === "string" ? item.payment_status : "offline_pending",
    currency: typeof priceSnapshot.currency === "string" ? priceSnapshot.currency : "INR",
    total_amount: typeof priceSnapshot.total_amount === "number" ? priceSnapshot.total_amount : 0,
    created_at: typeof item.created_at === "string" ? item.created_at : null,
  };
}

export async function fetchMyAccommodationBookings(signal?: AbortSignal): Promise<AccommodationBookingSummary[]> {
  const response = await apiFetch("/api/v1/accommodation-bookings/mine?limit=50", { signal });
  if (!response.ok) {
    throw new Error(`Failed to load bookings (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  if (!isRecord(json) || !Array.isArray(json.items)) {
    throw new Error("Unexpected bookings response.");
  }
  return json.items
    .map((item) => parseBookingSummary(item))
    .filter((item): item is AccommodationBookingSummary => item !== null);
}

export type CreateAccommodationBookingInput = {
  accommodation_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_requests?: string;
};

export async function createAccommodationBooking(input: CreateAccommodationBookingInput): Promise<void> {
  const response = await apiFetch("/api/v1/accommodation-bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    const message = payload?.error?.message ?? `Failed to reserve stay (HTTP ${response.status}).`;
    throw new Error(message);
  }
}
