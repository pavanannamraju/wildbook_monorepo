import { ChartLineIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  fetchAnalyticsFunnel,
  type AnalyticsFunnelResponse,
} from "../../api/analytics";
import { PageErrorState } from "../../components/common/PageErrorState";

function formatDrop(drop: number | null): string {
  if (drop == null) return "—";
  return `${Math.round(drop * 100)}%`;
}

export function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsFunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchAnalyticsFunnel(undefined, controller.signal)
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setData(null);
        setError(err instanceof Error ? err.message : "Failed to load funnel.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h2
          className="text-[18px] font-extrabold tracking-[-0.03em] text-(--color-wildbook-text) sm:text-[20px] md:text-[24px]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          Analytics
        </h2>
        <p className="mt-2 text-sm text-(--color-wildbook-muted)">
          Home → enquiry funnel drop rates (ordered steps, last 30 days).
        </p>
      </header>

      {error ? <PageErrorState message={error} /> : null}

      {loading ? (
        <p className="text-sm text-(--color-wildbook-muted)">Loading…</p>
      ) : data ? (
        <>
          <p className="mb-4 text-xs text-(--color-wildbook-muted)">
            {data.events} events · {data.visitors} visitors · step window{" "}
            {data.step_window_hours}h
          </p>
          <div className="overflow-x-auto rounded-[8px] border border-black/10 bg-white">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-[0.12em] text-(--color-wildbook-muted)">
                <tr>
                  <th className="px-4 py-3 font-bold">Step</th>
                  <th className="px-4 py-3 font-bold">Uniques</th>
                  <th className="px-4 py-3 font-bold">Drop from prev</th>
                </tr>
              </thead>
              <tbody>
                {data.steps.map((row) => (
                  <tr key={row.step} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.step}</td>
                    <td className="px-4 py-3 tabular-nums">{row.uniques}</td>
                    <td className="px-4 py-3 tabular-nums">{formatDrop(row.drop_from_prev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {!loading && !error && !data ? (
        <div className="flex items-start gap-3 rounded-[8px] border border-black/10 bg-white px-4 py-5 text-sm text-(--color-wildbook-muted)">
          <ChartLineIcon size={20} className="mt-0.5 shrink-0 text-(--color-wildbook-teal)" />
          No funnel data yet.
        </div>
      ) : null}
    </div>
  );
}
