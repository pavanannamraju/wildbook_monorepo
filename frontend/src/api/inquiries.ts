import { apiFetch } from "./client";

export type CreateInquiryInput = {
  expert_id: string;
  expert_name: string;
  customer_name: string;
  customer_email: string;
  travel_dates?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseInquiry(payload: unknown): InquiryResponse {
  if (!isRecord(payload) || typeof payload.id !== "string") {
    throw new Error("Unexpected inquiry response.");
  }
  return payload as unknown as InquiryResponse;
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

