import { apiFetch } from "./client";

export type BookmarkType = "expert" | "homestay";

type BookmarkStatusResponse = {
  type: BookmarkType;
  bookmarked_target_ids: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBookmarkStatusResponse(payload: unknown): BookmarkStatusResponse {
  if (!isRecord(payload)) {
    throw new Error("Unexpected bookmark status response.");
  }
  const type = payload.type;
  const bookmarkedTargetIds = payload.bookmarked_target_ids;
  if (type !== "expert" && type !== "homestay") {
    throw new Error("Unexpected bookmark status type.");
  }
  if (!Array.isArray(bookmarkedTargetIds)) {
    throw new Error("Unexpected bookmark status response list.");
  }
  return {
    type,
    bookmarked_target_ids: bookmarkedTargetIds.filter((item): item is string => typeof item === "string"),
  };
}

export async function fetchBookmarkStatuses(
  type: BookmarkType,
  targetIds: string[],
  signal?: AbortSignal,
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const query = new URLSearchParams();
  query.set("type", type);
  for (const targetId of targetIds) {
    query.append("target_ids", targetId);
  }
  const response = await apiFetch(`/api/v1/bookmarks/status?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load bookmarks (HTTP ${response.status}).`);
  }
  const json = (await response.json()) as unknown;
  const parsed = parseBookmarkStatusResponse(json);
  return new Set(parsed.bookmarked_target_ids);
}

export async function addBookmark(type: BookmarkType, targetId: string): Promise<void> {
  const response = await apiFetch("/api/v1/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, target_id: targetId }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save bookmark (HTTP ${response.status}).`);
  }
}

export async function removeBookmark(type: BookmarkType, targetId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/bookmarks/${encodeURIComponent(type)}/${encodeURIComponent(targetId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to remove bookmark (HTTP ${response.status}).`);
  }
}
