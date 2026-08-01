import { apiFetch } from "./client";
import type { CursorPage } from "./experts";

export type FeatureNotifyInput = {
  email: string;
  feature: string;
};

export type FeatureNotifyResult = {
  id: string;
  email: string;
  feature: string;
  already_subscribed: boolean;
};

export type FeatureNotifyListItem = {
  id: string;
  email: string;
  feature: string;
  created_at?: string | null;
};

export type ListFeatureNotificationsParams = {
  limit?: number;
  cursor?: string | null;
  feature?: string;
  email?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseListItem(payload: unknown): FeatureNotifyListItem {
  if (!isRecord(payload) || typeof payload.id !== "string") {
    throw new Error("Unexpected feature notification response.");
  }
  return {
    id: payload.id,
    email: typeof payload.email === "string" ? payload.email : "",
    feature: typeof payload.feature === "string" ? payload.feature : "",
    created_at: typeof payload.created_at === "string" ? payload.created_at : null,
  };
}

function parsePage(payload: unknown): CursorPage<FeatureNotifyListItem> {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error("Unexpected feature notifications list response.");
  }
  return {
    items: payload.items.map(parseListItem),
    next_cursor: typeof payload.next_cursor === "string" ? payload.next_cursor : null,
    total_count: typeof payload.total_count === "number" ? payload.total_count : null,
  };
}

export async function subscribeFeatureNotification(
  payload: FeatureNotifyInput,
  signal?: AbortSignal,
): Promise<FeatureNotifyResult> {
  const response = await apiFetch("/api/v1/feature-notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: { message?: string }; detail?: string | Array<{ msg?: string }> }
      | null;
    const message =
      errorPayload?.error?.message ??
      (typeof errorPayload?.detail === "string" ? errorPayload.detail : null) ??
      `Failed to subscribe (HTTP ${response.status}).`;
    throw new Error(message);
  }

  const json = (await response.json()) as FeatureNotifyResult;
  return json;
}

export async function listFeatureNotifications(
  params: ListFeatureNotificationsParams = {},
  signal?: AbortSignal,
): Promise<CursorPage<FeatureNotifyListItem>> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.feature) search.set("feature", params.feature);
  if (params.email) search.set("email", params.email);

  const query = search.toString();
  const response = await apiFetch(`/api/v1/feature-notifications${query ? `?${query}` : ""}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to load feature notifications (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  return parsePage(json);
}
