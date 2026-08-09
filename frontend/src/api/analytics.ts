import { apiFetch } from "./client";

export type AnalyticsFunnelStep = {
  step: string;
  uniques: number;
  drop_from_prev: number | null;
};

export type AnalyticsFunnelResponse = {
  lookback_hours: number;
  step_window_hours: number;
  events: number;
  visitors: number;
  steps: AnalyticsFunnelStep[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStep(payload: unknown): AnalyticsFunnelStep {
  if (!isRecord(payload) || typeof payload.step !== "string" || typeof payload.uniques !== "number") {
    throw new Error("Unexpected analytics funnel step.");
  }
  const drop = payload.drop_from_prev;
  return {
    step: payload.step,
    uniques: payload.uniques,
    drop_from_prev: typeof drop === "number" ? drop : null,
  };
}

export async function fetchAnalyticsFunnel(
  params?: { lookback_hours?: number; step_window_hours?: number },
  signal?: AbortSignal,
): Promise<AnalyticsFunnelResponse> {
  const qs = new URLSearchParams();
  if (params?.lookback_hours != null) qs.set("lookback_hours", String(params.lookback_hours));
  if (params?.step_window_hours != null) qs.set("step_window_hours", String(params.step_window_hours));
  const suffix = qs.size ? `?${qs}` : "";
  const payload = await apiFetch(`/api/v1/analytics/funnel${suffix}`, { signal });
  if (
    !isRecord(payload) ||
    typeof payload.lookback_hours !== "number" ||
    typeof payload.step_window_hours !== "number" ||
    typeof payload.events !== "number" ||
    typeof payload.visitors !== "number" ||
    !Array.isArray(payload.steps)
  ) {
    throw new Error("Unexpected analytics funnel response.");
  }
  return {
    lookback_hours: payload.lookback_hours,
    step_window_hours: payload.step_window_hours,
    events: payload.events,
    visitors: payload.visitors,
    steps: payload.steps.map(parseStep),
  };
}
