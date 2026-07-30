import { useEffect, useState } from "react";

import { fetchAccommodationById, type AccommodationDetail } from "../api/accommodations";

export function useAccommodation(slugOrId: string | undefined) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AccommodationDetail | null>(null);

  useEffect(() => {
    if (!slugOrId) {
      setStatus("error");
      setError("Missing accommodation identifier.");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    fetchAccommodationById(slugOrId, controller.signal)
      .then((result) => {
        setData(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load accommodation.");
      });

    return () => controller.abort();
  }, [slugOrId]);

  return { status, error, data };
}
