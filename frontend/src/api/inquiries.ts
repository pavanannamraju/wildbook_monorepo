import { apiFetch } from "./client";
import type { CursorPage } from "./experts";

export type InquiryStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed"
  | "spam";

export type InquiryDatesPreference = "fixed" | "flexible";

export type CreateInquiryInput = {
  expert_id: string;
  expert_name: string;
  customer_name: string;
  customer_email: string;
  dates_preference: InquiryDatesPreference;
  travel_start_date?: string;
  travel_end_date?: string;
  group_size?: string;
  enquiry_message: string;
  source?: string;
};

export type InquiryResponse = {
  id: string;
  expert_id: string;
  expert_name: string;
  customer_name: string;
  customer_email: string;
  dates_preference?: InquiryDatesPreference | null;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  travel_dates?: string | null;
  group_size?: string | null;
  enquiry_message: string;
  source: string;
  status: string;
  priority: string;
  assigned_to?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ListInquiriesParams = {
  limit?: number;
  cursor?: string | null;
  expert_id?: string;
  status?: InquiryStatus | "";
  email?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseInquiry(payload: unknown): InquiryResponse {
  if (!isRecord(payload) || typeof payload.id !== "string") {
    throw new Error("Unexpected inquiry response.");
  }
  return payload as unknown as InquiryResponse;
}

function parseInquiryPage(payload: unknown): CursorPage<InquiryResponse> {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error("Unexpected inquiries list response.");
  }
  return {
    items: payload.items.map(parseInquiry),
    next_cursor: typeof payload.next_cursor === "string" ? payload.next_cursor : null,
    total_count: typeof payload.total_count === "number" ? payload.total_count : null,
  };
}

export async function createInquiry(
  input: CreateInquiryInput,
  signal?: AbortSignal,
): Promise<InquiryResponse> {
  const response = await apiFetch("/api/v1/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to submit enquiry (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseInquiry(json);
}

export async function listInquiries(
  params: ListInquiriesParams = {},
  signal?: AbortSignal,
): Promise<CursorPage<InquiryResponse>> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.expert_id) search.set("expert_id", params.expert_id);
  if (params.status) search.set("status", params.status);
  if (params.email) search.set("email", params.email);

  const query = search.toString();
  const response = await apiFetch(`/api/v1/inquiries${query ? `?${query}` : ""}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load inquiries (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parseInquiryPage(json);
}
