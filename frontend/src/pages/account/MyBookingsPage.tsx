import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyAccommodationBookings, type AccommodationBookingSummary } from "../../api/accommodationBookings";
import { PageErrorState } from "../../components/common/PageErrorState";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-black/10 text-(--color-wildbook-muted)",
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<AccommodationBookingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyAccommodationBookings(controller.signal)
      .then(setBookings)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load bookings.");
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return <PageErrorState message={error} />;
  }

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-(--color-wildbook-text) sm:text-[20px] md:text-[22px]">My Bookings</h1>
      <p className="mt-1 text-sm text-(--color-wildbook-muted)">Stays you've reserved through Wildbook.</p>

      {bookings === null ? (
        <p className="mt-8 text-sm text-(--color-wildbook-muted)">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-(--color-wildbook-muted)">You don't have any bookings yet.</p>
          <Link
            to="/experts"
            className="mt-4 inline-flex h-10 items-center justify-center rounded bg-(--color-wildbook-teal) px-5 text-sm font-medium text-white transition-colors hover:bg-[#095852]"
          >
            Explore Experts
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  to={`/accommodations/${booking.accommodation_id}`}
                  className="text-sm font-medium text-(--color-wildbook-text) hover:text-(--color-wildbook-teal)"
                >
                  {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                </Link>
                <p className="mt-1 text-sm text-(--color-wildbook-muted)">
                  {booking.adults} {booking.adults === 1 ? "adult" : "adults"} · {booking.currency}{" "}
                  {booking.total_amount.toLocaleString()}
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  STATUS_STYLES[booking.status] ?? "bg-black/10 text-(--color-wildbook-muted)"
                }`}
              >
                {booking.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
