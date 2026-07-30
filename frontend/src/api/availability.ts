import { apiFetch } from "./client";

export type AvailabilitySlot = {
  slot_id: string;
  guide_id: string;
  offering_id: string;
  start_at: string;
  end_at: string;
  capacity_total: number;
  capacity_blocked: number;
  capacity_held: number;
  capacity_booked: number;
  capacity_available: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSlot(item: unknown): AvailabilitySlot {
  if (!isRecord(item)) throw new Error("Invalid slot shape");
  return {
    slot_id: typeof item.slot_id === "string" ? item.slot_id : "",
    guide_id: typeof item.guide_id === "string" ? item.guide_id : "",
    offering_id: typeof item.offering_id === "string" ? item.offering_id : "",
    start_at: typeof item.start_at === "string" ? item.start_at : "",
    end_at: typeof item.end_at === "string" ? item.end_at : "",
    capacity_total: typeof item.capacity_total === "number" ? item.capacity_total : 0,
    capacity_blocked: typeof item.capacity_blocked === "number" ? item.capacity_blocked : 0,
    capacity_held: typeof item.capacity_held === "number" ? item.capacity_held : 0,
    capacity_booked: typeof item.capacity_booked === "number" ? item.capacity_booked : 0,
    capacity_available: typeof item.capacity_available === "number" ? item.capacity_available : 0,
  };
}

type FetchSlotsParams = {
  guideId: string;
  offeringId: string;
  partySize?: number;
  startAt: string;
  endAt: string;
  limit?: number;
};

export async function fetchAvailabilitySlots(
  params: FetchSlotsParams,
  signal?: AbortSignal,
): Promise<AvailabilitySlot[]> {
  const query = new URLSearchParams({
    guide_id: params.guideId,
    offering_id: params.offeringId,
    party_size: String(params.partySize ?? 1),
    start_at: params.startAt,
    end_at: params.endAt,
  });
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  const response = await apiFetch(`/api/availability/slots?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load availability (HTTP ${response.status})`);
  }

  const json: unknown = await response.json();
  if (!isRecord(json) || !Array.isArray(json.items)) return [];
  return json.items.map(parseSlot);
}
