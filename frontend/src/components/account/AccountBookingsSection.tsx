import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyAccommodationBookings,
  type AccommodationBookingSummary,
} from "../../api/accommodationBookings";
import { PageErrorState } from "../common/PageErrorState";
import { UserAvatar } from "../common/UserAvatar";
import { SecondaryBtn } from "./AccountFormControls";
import { cardClassName, EmptyState, SectionTitle } from "./AccountSection";

type BookingsTab = "upcoming" | "past";

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isUpcomingBooking(booking: AccommodationBookingSummary, today: Date): boolean {
  if (booking.status === "declined" || booking.status === "cancelled") return false;
  if (!booking.check_out) return booking.status === "pending" || booking.status === "confirmed";
  const checkout = new Date(booking.check_out);
  if (Number.isNaN(checkout.getTime())) return booking.status === "pending" || booking.status === "confirmed";
  return checkout >= today;
}

function statusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

export function AccountBookingsSection() {
  const [bookings, setBookings] = useState<AccommodationBookingSummary[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingsTab, setBookingsTab] = useState<BookingsTab>("upcoming");

  useEffect(() => {
    const controller = new AbortController();
    fetchMyAccommodationBookings(controller.signal)
      .then(setBookings)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBookingsError(error instanceof Error ? error.message : "Failed to load bookings.");
      });
    return () => controller.abort();
  }, []);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const upcomingBookings = useMemo(
    () => (bookings ?? []).filter((booking) => isUpcomingBooking(booking, today)),
    [bookings, today],
  );
  const pastBookings = useMemo(
    () => (bookings ?? []).filter((booking) => !isUpcomingBooking(booking, today)),
    [bookings, today],
  );
  const visibleBookings = bookingsTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <section id="bookings" className={`scroll-mt-28 mt-5 ${cardClassName}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle icon={CalendarDotsIcon} eyebrow="Your journeys" title="My bookings" />
        <div className="flex h-9 rounded-[4px] bg-[#F6F4F1] p-1">
          {(
            [
              { id: "upcoming", label: "Upcoming" },
              { id: "past", label: "Past" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBookingsTab(tab.id)}
              className={`rounded-[4px] px-4 py-1.5 text-xs font-semibold transition-colors ${
                bookingsTab === tab.id
                  ? "bg-white text-[#0B6E66] shadow-sm"
                  : "text-[#73706C]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {bookingsError ? (
          <PageErrorState message={bookingsError} />
        ) : bookings === null ? (
          <p className="text-sm text-[#73706C]">Loading your bookings…</p>
        ) : visibleBookings.length === 0 ? (
          <EmptyState>
            <p>{bookingsTab === "upcoming" ? "No upcoming bookings." : "No past bookings yet."}</p>
            {bookingsTab === "upcoming" ? (
              <Link
                to="/experts"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#0B6E66] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
              >
                Explore Experts
              </Link>
            ) : null}
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {visibleBookings.map((booking) => (
              <div
                key={booking.id}
                className={`flex flex-col gap-4 rounded-[8px] border border-[#E3DDD8] bg-[#F8F6F3] p-4 transition-colors hover:border-[#9BCDB2] md:flex-row md:items-center ${
                  bookingsTab === "past" ? "opacity-80 hover:opacity-100" : ""
                }`}
              >
                <UserAvatar
                  initials="WB"
                  color={bookingsTab === "past" ? "#E3DDD8" : "#C8DED5"}
                  ring
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#3B372F]">
                      {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                    </p>
                    <span
                      className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold ${
                        booking.status === "confirmed"
                          ? "bg-[#9BCDB2]/40 text-[#0B6E66]"
                          : booking.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#E8E2DC] text-[#73706C]"
                      }`}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#73706C]">
                    {booking.adults} {booking.adults === 1 ? "adult" : "adults"}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-semibold text-[#3B372F]">{formatDate(booking.check_in)}</p>
                  <p className="mt-1 text-xs text-[#73706C]">
                    {booking.currency} {booking.total_amount.toLocaleString()}
                  </p>
                </div>
                {bookingsTab === "past" ? (
                  <Link
                    to={`/accommodations/${booking.accommodation_id}`}
                    className="inline-flex items-center gap-2 rounded-[4px] border border-[#D7D2CC] bg-white px-3 py-2 text-xs font-semibold text-[#73706C] transition-colors hover:bg-[#F6F4F1]"
                  >
                    View details
                  </Link>
                ) : (
                  <SecondaryBtn href={`/accommodations/${booking.accommodation_id}`}>
                    View details
                  </SecondaryBtn>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
