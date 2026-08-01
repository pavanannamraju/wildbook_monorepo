import { CaretDownIcon, EnvelopeSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listInquiries,
  type InquiryResponse,
  type InquiryStatus,
} from "../../api/inquiries";
import { PageErrorState } from "../../components/common/PageErrorState";

const STATUS_OPTIONS: Array<{ value: InquiryStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_customer", label: "Waiting on customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[#0B6E66]/15 text-[#0B6E66]",
  triaged: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-900",
  waiting_customer: "bg-violet-100 text-violet-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-black/10 text-(--color-wildbook-muted)",
  spam: "bg-red-100 text-red-800",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-(--color-wildbook-muted)",
  medium: "text-(--color-wildbook-text)",
  high: "text-amber-800",
  urgent: "text-red-700",
};

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

function formatTravelDate(value?: string | null): string {
  if (!value) return "";
  // Prefer date-only formatting for YYYY-MM-DD to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatTravelDates(inquiry: InquiryResponse): string {
  if (inquiry.dates_preference === "flexible") {
    return "Flexible";
  }
  if (inquiry.travel_start_date || inquiry.travel_end_date) {
    const start = formatTravelDate(inquiry.travel_start_date) || "—";
    const end = formatTravelDate(inquiry.travel_end_date) || "—";
    return `${start} – ${end}`;
  }
  if (inquiry.travel_dates) {
    return inquiry.travel_dates;
  }
  if (inquiry.dates_preference === "fixed") {
    return "Fixed dates (not specified)";
  }
  return "—";
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function InquiryRow({ inquiry }: { inquiry: InquiryResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-2xl border border-black/10 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-start sm:justify-between"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                STATUS_STYLES[inquiry.status] ?? "bg-black/10 text-(--color-wildbook-muted)"
              }`}
            >
              {statusLabel(inquiry.status)}
            </span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                PRIORITY_STYLES[inquiry.priority] ?? "text-(--color-wildbook-muted)"
              }`}
            >
              {inquiry.priority}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-(--color-wildbook-text)">
            {inquiry.customer_name}
            <span className="font-normal text-(--color-wildbook-muted)"> → {inquiry.expert_name}</span>
          </p>
          <p className="mt-1 truncate text-sm text-(--color-wildbook-muted)">{inquiry.customer_email}</p>
          <p className="mt-1 text-xs text-(--color-wildbook-muted)">
            Dates: {formatTravelDates(inquiry)}
            {inquiry.group_size ? ` · ${inquiry.group_size} people` : ""}
          </p>
          {!expanded ? (
            <p className="mt-2 line-clamp-2 text-sm text-(--color-wildbook-text)">{inquiry.enquiry_message}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <time className="text-xs text-(--color-wildbook-muted)">{formatDateTime(inquiry.created_at)}</time>
          <CaretDownIcon
            size={16}
            className={`text-(--color-wildbook-muted) transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-black/8 px-4 pb-4 pt-3">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                Travel dates
              </dt>
              <dd className="mt-1 text-(--color-wildbook-text)">
                {formatTravelDates(inquiry)}
                {inquiry.dates_preference === "flexible" ? (
                  <span className="ml-2 inline-flex rounded-full bg-[#0B6E66]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0B6E66]">
                    Flexible
                  </span>
                ) : inquiry.dates_preference === "fixed" || inquiry.travel_start_date || inquiry.travel_dates ? (
                  <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                    Fixed
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                Group size
              </dt>
              <dd className="mt-1 text-(--color-wildbook-text)">{inquiry.group_size || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                Expert
              </dt>
              <dd className="mt-1">
                <Link
                  to={`/experts/${inquiry.expert_id}`}
                  className="font-medium text-(--color-wildbook-teal) hover:underline"
                >
                  {inquiry.expert_name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                Source
              </dt>
              <dd className="mt-1 text-(--color-wildbook-text)">{inquiry.source}</dd>
            </div>
            {inquiry.assigned_to ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                  Assigned to
                </dt>
                <dd className="mt-1 text-(--color-wildbook-text)">{inquiry.assigned_to}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
              Enquiry
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-(--color-wildbook-text)">
              {inquiry.enquiry_message}
            </p>
          </div>

          {inquiry.admin_notes ? (
            <div className="mt-4 rounded-xl bg-[#F6F4F1] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
                Admin notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-(--color-wildbook-text)">
                {inquiry.admin_notes}
              </p>
            </div>
          ) : null}

          <a
            href={`mailto:${inquiry.customer_email}?subject=${encodeURIComponent(`Re: your Wildbook enquiry for ${inquiry.expert_name}`)}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-wildbook-teal) hover:underline"
          >
            <EnvelopeSimpleIcon size={16} />
            Email customer
          </a>
        </div>
      ) : null}
    </li>
  );
}

export function AdminInquiriesPage() {
  const [items, setItems] = useState<InquiryResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "">("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listInquiries(
      {
        limit: 20,
        status: statusFilter,
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
        setError(err instanceof Error ? err.message : "Failed to load inquiries.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [emailFilter, statusFilter]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await listInquiries({
        limit: 20,
        cursor: nextCursor,
        status: statusFilter,
        email: emailFilter || undefined,
      });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.next_cursor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more inquiries.");
    } finally {
      setLoadingMore(false);
    }
  }

  function handleEmailSearch(event: React.FormEvent) {
    event.preventDefault();
    setEmailFilter(emailDraft.trim().toLowerCase());
  }

  return (
    <div>
      <header className="mb-6">
        <h2
          className="text-[24px] font-extrabold tracking-[-0.03em] text-(--color-wildbook-text)"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          Inquiries
        </h2>
        <p className="mt-2 text-sm text-(--color-wildbook-muted)">
          Expert enquiry submissions from travellers.
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InquiryStatus | "")}
            className="h-10 w-full rounded-[4px] border border-[#D7D2CC] bg-white px-3 text-sm text-(--color-wildbook-text) outline-none focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 sm:w-56"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={handleEmailSearch} className="flex w-full gap-2 sm:max-w-sm">
          <label className="relative min-w-0 flex-1 text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-(--color-wildbook-muted)">
              Customer email
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
            className="mt-[22px] h-10 shrink-0 rounded-[4px] bg-(--color-wildbook-teal) px-4 text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
          >
            Search
          </button>
        </form>
      </div>

      {error ? <PageErrorState message={error} className="mb-4" /> : null}

      {loading ? (
        <p className="text-sm text-(--color-wildbook-muted)">Loading inquiries…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
          <p className="text-sm text-(--color-wildbook-muted)">No inquiries match these filters.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-(--color-wildbook-muted)">
            Showing {items.length}
            {nextCursor ? "+" : ""}{" "}
            {items.length === 1 ? "inquiry" : "inquiries"}
          </p>
          <ul className="space-y-3">
            {items.map((inquiry) => (
              <InquiryRow key={inquiry.id} inquiry={inquiry} />
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
