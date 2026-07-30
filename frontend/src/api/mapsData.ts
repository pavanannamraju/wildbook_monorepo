import { apiFetch } from "./client";

export type MongoOid = {
  $oid: string;
};

export type GeoJsonPoint = {
  type: "Point";
  coordinates: readonly [number, number]; // [lng, lat]
};

export type MapsDataDocument = {
  _id: MongoOid;
  site_id: number;
  name: string;
  state: string;
  lgd_statecode: number;
  district: string;
  lgd_districtcode: number;
  category: string;
  habitat: string;
  bio_zone: string;
  animals: string[];
  plants: string[];
  year_visit: string;
  area_km2: number;
  area_display: string;
  notification_date: string;
  notificationdate_raw: string;
  geometry: GeoJsonPoint;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMongoOid(value: unknown): value is MongoOid {
  if (!isRecord(value)) return false;
  return typeof value.$oid === "string" && value.$oid.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isGeoJsonPoint(value: unknown): value is GeoJsonPoint {
  if (!isRecord(value)) return false;
  if (value.type !== "Point") return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
  const [lng, lat] = value.coordinates;
  return typeof lng === "number" && Number.isFinite(lng) && typeof lat === "number" && Number.isFinite(lat);
}

export function parseMapsDataResponse(payload: unknown): MapsDataDocument[] {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected maps-data response: expected a JSON array.");
  }

  const parsed: MapsDataDocument[] = [];
  for (const item of payload) {
    if (!isRecord(item)) continue;
    if (!isMongoOid(item._id)) continue;
    if (typeof item.site_id !== "number") continue;
    if (typeof item.name !== "string") continue;
    if (typeof item.state !== "string") continue;
    if (typeof item.lgd_statecode !== "number") continue;
    if (typeof item.district !== "string") continue;
    if (typeof item.lgd_districtcode !== "number") continue;
    if (typeof item.category !== "string") continue;
    if (typeof item.habitat !== "string") continue;
    if (typeof item.bio_zone !== "string") continue;
    if (!isStringArray(item.animals)) continue;
    if (!isStringArray(item.plants)) continue;
    if (typeof item.year_visit !== "string") continue;
    if (typeof item.area_km2 !== "number") continue;
    if (typeof item.area_display !== "string") continue;
    if (typeof item.notification_date !== "string") continue;
    if (typeof item.notificationdate_raw !== "string") continue;
    if (!isGeoJsonPoint(item.geometry)) continue;

    parsed.push(item as MapsDataDocument);
  }

  return parsed;
}

export async function fetchMapsData(signal?: AbortSignal): Promise<MapsDataDocument[]> {
  const response = await apiFetch("/api/v1/maps-data", { signal });
  if (!response.ok) {
    let detail: string | null = null;
    try {
      const payload = (await response.json()) as unknown;
      if (typeof payload === "string") {
        detail = payload;
      } else if (isRecord(payload)) {
        // Backend error shape: { error: { code, message } }
        const maybeError = payload.error;
        if (isRecord(maybeError) && typeof maybeError.message === "string") {
          detail = maybeError.message;
        }
        // Some proxies/clients might surface { code, message }
        if (!detail && typeof payload.message === "string") {
          detail = payload.message;
        }
      }
    } catch {
      // ignore parse errors; we'll fall back to status text
    }
    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`Failed to load maps data (HTTP ${response.status})${suffix}.`);
  }
  const json = (await response.json()) as unknown;
  return parseMapsDataResponse(json);
}

