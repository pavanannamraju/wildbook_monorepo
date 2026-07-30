import { useEffect, useMemo, useState } from "react";

import { fetchMapsData, type MapsDataDocument } from "../api/mapsData";

type UseMapsDataState =
  | { status: "idle" | "loading"; data: null; error: null }
  | { status: "success"; data: MapsDataDocument[]; error: null }
  | { status: "error"; data: null; error: string };

export function useMapsData() {
  const [state, setState] = useState<UseMapsDataState>({
    status: "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", data: null, error: null });

    fetchMapsData(controller.signal)
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Failed to load maps data.";
        setState({ status: "error", data: null, error: message });
      });

    return () => controller.abort();
  }, []);

  const docs = state.status === "success" ? state.data : [];
  const stats = useMemo(() => {
    return {
      total: docs.length,
    };
  }, [docs.length]);

  return { ...state, stats };
}

