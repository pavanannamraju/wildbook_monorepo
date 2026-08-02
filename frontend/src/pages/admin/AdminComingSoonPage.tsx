import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  listFeatureNotifications,
  type FeatureNotifyListItem,
} from "../../api/featureNotifications";
import { PageErrorState } from "../../components/common/PageErrorState";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminComingSoonPage() {
  const [items, setItems] = useState<FeatureNotifyListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [featureDraft, setFeatureDraft] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listFeatureNotifications(
      {
        limit: 20,
        feature: featureFilter || undefined,
        email: emailFilter || undefined,
      },
      controller.signal,
    )
      .then((page) => {
        setItems(page.items);
        setNextCursor(page.next_cursor);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setItems([]);
        setNextCursor(null);
        setError(err instanceof Error ? err.message : "Failed to load signups.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [emailFilter, featureFilter]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await listFeatureNotifications({
        limit: 20,
        cursor: nextCursor,
        feature: featureFilter || undefined,
        email: emailFilter || undefined,
      });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.next_cursor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more signups.");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setFeatureFilter(featureDraft.trim());
    setEmailFilter(emailDraft.trim().toLowerCase());
  }

  return (
    <div>
      <header className="mb-6">
        <h2
          className="text-[18px] font-extrabold tracking-[-0.03em] text-(--color-wildbook-text) sm:text-[20px] md:text-[24px]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          Coming soon
        </h2>
        <p className="mt-2 text-sm text-(--color-wildbook-muted)">
          People who asked to be notified when a feature launches.
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
            Feature
          </span>
          <input
            type="text"
            value={featureDraft}
            onChange={(event) => setFeatureDraft(event.target.value)}
            placeholder="e.g. Homestays"
            className="h-10 w-full rounded-[4px] border border-[#D7D2CC] bg-white px-3 text-sm outline-none placeholder:text-(--color-wildbook-muted) focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30"
          />
        </label>
        <label className="relative block text-sm">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
            Email
          </span>
          <span className="relative block">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-wildbook-muted)"
            />
            <input
              type="email"
              value={emailDraft}
              onChange={(event) => setEmailDraft(event.target.value)}
              placeholder="Filter by email"
              className="h-10 w-full rounded-[4px] border border-[#D7D2CC] bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-(--color-wildbook-muted) focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30"
            />
          </span>
        </label>
        <button
          type="submit"
          className="h-10 self-end rounded-[4px] bg-(--color-wildbook-teal) px-4 text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
        >
          Search
        </button>
      </form>

      {error ? <PageErrorState message={error} className="mb-4" /> : null}

      {loading ? (
        <p className="text-sm text-(--color-wildbook-muted)">Loading signups…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
          <p className="text-sm text-(--color-wildbook-muted)">No notify-me signups match these filters.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-(--color-wildbook-muted)">
            Showing {items.length}
            {nextCursor ? "+" : ""} {items.length === 1 ? "signup" : "signups"}
          </p>
          <ul className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  index > 0 ? "border-t border-black/8" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-(--color-wildbook-text)">{item.email}</p>
                  <p className="mt-0.5 text-sm text-(--color-wildbook-muted)">{item.feature}</p>
                </div>
                <time className="shrink-0 text-xs text-(--color-wildbook-muted)">
                  {formatDateTime(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
          {nextCursor ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="rounded-[4px] border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-(--color-wildbook-text) transition-colors hover:border-(--color-wildbook-teal) hover:text-(--color-wildbook-teal) disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
