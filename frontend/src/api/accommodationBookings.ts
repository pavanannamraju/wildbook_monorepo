import { apiFetch } from "./client";

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
