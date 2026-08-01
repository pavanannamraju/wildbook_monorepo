import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDotsIcon,
  LockKeyIcon,
  MapPinIcon,
  ShareNetworkIcon,
  StarIcon,
} from "@phosphor-icons/react";

import { createAccommodationBooking } from "../api/accommodationBookings";
import { fetchExpertById, type ExperienceDetail } from "../api/experts";
import { useAccommodation } from "../hooks/useAccommodation";
import { PageLoader } from "../components/PageLoader";
import { PageErrorState } from "../components/common/PageErrorState";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";
import { HeroReveal, Reveal } from "../motion";

export function AccommodationDetailPage() {
  const { slugOrId } = useParams();
  const { status, error, data } = useAccommodation(slugOrId);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"homestay_only" | "with_experience">("homestay_only");
  const [expertExperiences, setExpertExperiences] = useState<ExperienceDetail[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const estimated = useMemo(() => {
    if (!data || !checkIn || !checkOut || !data.base_rate_amount) return null;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const nights = Math.max(Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
    if (nights <= 0) return null;
    const subtotal = data.base_rate_amount * nights * Math.max(Number(adults) || 1, 1);
    const taxes = Math.round(subtotal * ((data.default_tax_rate_pct ?? 0) / 100));
    return { nights, subtotal, taxes, total: subtotal + taxes };
  }, [adults, checkIn, checkOut, data]);

  const handleReserve = async () => {
    if (!data) return;
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      await createAccommodationBooking({
        accommodation_id: data.id,
        check_in: checkIn,
        check_out: checkOut,
        adults: Math.max(Number(adults) || 1, 1),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        special_requests: specialRequests.trim() || undefined,
      });
      setSubmitStatus("success");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Failed to reserve stay.");
    }
  };

  const expertProfileRef = data?.expert_slug ?? data?.expert_id ?? null;
  useEffect(() => {
    if (!expertProfileRef) {
      setExpertExperiences([]);
      return;
    }
    const controller = new AbortController();
    fetchExpertById(expertProfileRef, controller.signal)
      .then((expert) => {
        setExpertExperiences(expert.experiences_full ?? []);
      })
      .catch(() => {
        setExpertExperiences([]);
      });

    return () => controller.abort();
  }, [expertProfileRef]);

  const curatedExperiences = useMemo(() => {
    if (!data) return [];
    if (expertExperiences.length > 0) return expertExperiences;
    return (data.experiences ?? []).slice(0, 2).map((title, index) => ({
      id: `${data.id}-fallback-exp-${index}`,
      title,
      pricing: { amount: 1200 + index * 650, currency: data.currency, per: "person" },
    }));
  }, [data, expertExperiences]);
  if (status === "loading") return <PageLoader />;
  if (status === "error" || !data) {
    return <PageErrorState message={error ?? "Not found."} className="bg-[#F0EDE9]" />;
  }

  const hostName =
    data.host?.name ?? data.name.replace(/^Homestay by\s+/i, "").trim() ?? "Homestay Host";
  const heroImage =
    data.images?.find((image) => image.is_primary)?.url ??
    data.images?.[0]?.url ??
    data.gallery_media[0]?.media_url ??
    "https://images.unsplash.com/photo-1448375240586-882707db888b";
  const gallery =
    data.gallery_media.length > 0
      ? data.gallery_media
      : [{ media_url: heroImage, media_type: "image" as const, sort_order: 0 }];
  const ratingLabel = (data.rating?.average ?? data.rating_avg ?? 4.8).toFixed(1);
  const reviewsLabel = data.rating?.reviews_count ?? data.reviews_count ?? 50;
  const costPerPerson = data.pricing?.price_per_person_per_night ?? data.base_rate_amount ?? 0;
  const locationLabel = [data.location?.name, data.location?.state].filter(Boolean).join(", ")
    || data.address_line
    || data.primary_location_id;
  const googleMapsUrl =
    data.map_url ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`;

  return (
    <main className="mx-auto max-w-[1920px] bg-[#F0EDE9]">
      <StickyTopNavbar />
      <div className="page-px py-6 lg:py-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <HeroReveal preset="image" className="block w-full">
            <img src={heroImage} alt={data.name} className="h-[280px] w-full object-cover md:h-[370px]" />
          </HeroReveal>
          <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/20 to-black/55" />
          <div className="absolute inset-x-0 top-0 p-4 md:p-6">
            <Link to="/experts" className="inline-flex items-center gap-2 text-xs text-white">
              <ArrowLeftIcon size={16} />
              Back to Expert Profile
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <HeroReveal delay={0.15} preset="fadeUp">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[34px] leading-tight text-white drop-shadow">{data.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-white">
                  <span className="inline-flex items-center gap-1 drop-shadow">
                    <MapPinIcon size={14} />
                    {locationLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 self-end md:items-end">
                <div className="inline-flex items-center gap-1 text-white drop-shadow">
                  <StarIcon size={16} weight="fill" className="text-[#F0D37A]" />
                  <span className="text-sm font-semibold">{ratingLabel}</span>
                  <span className="text-xs opacity-90">({reviewsLabel} Reviews)</span>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-white/70 bg-black/25 px-4 py-2 text-sm text-white hover:bg-black/35"
                >
                  View on Google Maps
                  <ArrowRightIcon size={14} />
                </a>
              </div>
            </div>
            </HeroReveal>
          </div>
        </div>

        <Reveal
          preset="fadeUp"
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          <aside className="order-2 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-[#FBF9F6] p-4 shadow-[0_0_0_1px_#ece8e3]">
              <div className="flex rounded bg-[#EFE9E2] p-1">
                <button
                  type="button"
                  onClick={() => setSelectedTab("homestay_only")}
                  className={`flex-1 rounded px-3 py-2 text-sm ${selectedTab === "homestay_only" ? "bg-[#0B6E66] text-white" : "text-[#5c5955]"}`}
                >
                  Homestay Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("with_experience")}
                  className={`flex-1 rounded px-3 py-2 text-sm ${selectedTab === "with_experience" ? "bg-[#0B6E66] text-white" : "text-[#5c5955]"}`}
                >
                  + Curated Experience
                </button>
              </div>
              <p className="mt-4 text-sm text-[#6a6763]">
                {selectedTab === "homestay_only"
                  ? "Choose a peaceful stay designed for rest, slow travel, and quiet time close to nature without structured activities or schedules."
                  : "Pair your stay with curated activities and guided nature sessions for a complete immersion."}
              </p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-[#5c5955]">Check In</span>
                  <div className="flex items-center gap-2 rounded bg-[#F6F4F0] px-3">
                    <input className="h-11 w-full bg-transparent" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                    <CalendarDotsIcon size={18} className="text-[#343330]" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-[#5c5955]">Check Out</span>
                  <div className="flex items-center gap-2 rounded bg-[#F6F4F0] px-3">
                    <input className="h-11 w-full bg-transparent" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                    <CalendarDotsIcon size={18} className="text-[#343330]" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-[#5c5955]">Group Size (Adults 18+)</span>
                  <input className="h-11 w-full rounded bg-[#F6F4F0] px-3" type="number" min={1} value={adults} onChange={(e) => setAdults(e.target.value)} />
                </label>
                {selectedTab === "with_experience" && (
                  <div className="rounded bg-[#F6F4F0] p-3 text-sm">
                    <p className="mb-2 text-[#6a6763]">Add Guide Curated experiences</p>
                    {curatedExperiences.slice(0, 2).map((experience, idx) => (
                      <label key={experience.id} className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2">
                          <input type="checkbox" className="h-4 w-4" />
                          <span>{experience.title}</span>
                        </span>
                        <span>
                          {experience.pricing?.currency ?? data.currency}{" "}
                          {(experience.pricing?.amount ?? 1200 + idx * 650).toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <input className="h-11 w-full rounded bg-[#F6F4F0] px-3" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your Name" />
                <input className="h-11 w-full rounded bg-[#F6F4F0] px-3" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Your Email" />
                <textarea className="w-full rounded bg-[#F6F4F0] p-3" rows={3} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Special requests" />
              </div>
              <div className="mt-4 rounded bg-[#F2EEEA] p-3 text-sm">
                <p className="flex items-center justify-between"><span>Cost / person</span><span>{data.currency} {costPerPerson.toFixed(2)}</span></p>
                {estimated ? (
                  <>
                    <p className="mt-1 flex items-center justify-between"><span>{estimated.nights} nights x {data.currency} {costPerPerson}</span><span>{data.currency} {(data.pricing?.base_cost ?? estimated.subtotal).toFixed(2)}</span></p>
                    <p className="mt-1 flex items-center justify-between"><span>Taxes</span><span>{data.currency} {(data.pricing?.taxes ?? estimated.taxes).toFixed(2)}</span></p>
                    <p className="mt-2 flex items-center justify-between font-semibold"><span>Total</span><span>{data.currency} {(data.pricing?.total_cost ?? estimated.total).toFixed(0)}</span></p>
                  </>
                ) : null}
              </div>
              <button className="mt-4 w-full rounded bg-[#0B6E66] py-3 text-white" type="button" onClick={() => void handleReserve()}>
                {submitStatus === "submitting" ? "Submitting..." : "Reserve"}
              </button>
              <p className="mt-2 text-xs text-[#6a6763]">
                Free cancellation up to 48 hours before check-in · Confirmed by {hostName.split(" ")[0]} directly
              </p>
              {submitError ? <p className="mt-2 text-xs text-red-600">{submitError}</p> : null}
              {submitStatus === "success" ? <p className="mt-2 text-xs text-[#0B6E66]">Booking request submitted.</p> : null}
            </div>
          </aside>

          <section className="order-1 space-y-8 lg:order-1">
            <div>
              <h1 className="text-[34px] leading-tight text-[#2F2B28]">{data.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[#4b4844]">
                <span className="inline-flex items-center gap-1 rounded bg-[#e8eeea] px-2 py-1">
                  <StarIcon size={14} weight="fill" className="text-[#e3bf5d]" />
                  {ratingLabel}
                </span>
                <span>({reviewsLabel} Reviews)</span>
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon size={14} />
                  {data.location?.name ?? data.address_line ?? data.primary_location_id}
                </span>
                {data.map_url ? (
                  <a href={data.map_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[#0B6E66] hover:underline">
                    View on Google Maps
                    <ArrowRightIcon size={14} className="ml-1" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[#0B6E66] hover:underline"
                >
                  Share
                  <ShareNetworkIcon size={14} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FBF9F6] p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#AB863F]">About the Homestay</p>
              <h2 className="mt-1 text-3xl text-[#2F2B28]">{data.description?.summary ?? "A home at the forest's edge"}</h2>
              <p className="mt-3 text-[#2F2B28]">{data.description?.details ?? data.about ?? "No description available."}</p>
            </div>

            <div>
              <h3 className="text-[#AB863F] text-2xl font-semibold">What to Expect</h3>
              <ul className="mt-3 space-y-2 text-[#2F2B28]">
                {(data.highlights && data.highlights.length > 0 ? data.highlights : data.what_to_expect).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[#AB863F] text-2xl font-semibold">Amenities</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(data.amenities && data.amenities.length > 0 ? data.amenities : data.amenity_names).map((item) => (
                  <span key={item} className="rounded bg-[#EDEAE4] px-3 py-2 text-sm text-[#2F2B28]">{item}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[#AB863F] text-2xl font-semibold">Gallery</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.slice(0, 6).map((media) => (
                  <img key={`${media.media_url}-${media.sort_order}`} src={media.media_url} alt={media.caption ?? data.name} className="h-44 w-full rounded object-cover" />
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[linear-gradient(130deg,#0f6c67,#1b7e74)] p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#d4be7d]">Homestay Host</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl">{hostName}</p>
                  <p className="text-sm text-white/85">
                    {data.host?.role ?? "Forest guide and local host"}
                    {typeof data.host?.experience_years === "number" ? ` · ${data.host.experience_years} Years Experience` : ""}
                  </p>
                </div>
                {expertProfileRef ? (
                  <Link
                    to={`/experts/${encodeURIComponent(expertProfileRef)}`}
                    className="inline-flex items-center gap-1 rounded border border-white/50 px-3 py-2 text-sm text-white"
                  >
                    View Profile
                    <ArrowRightIcon size={14} />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-[#FBF9F6] p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#AB863F]">Testimonials</p>
              <h3 className="mt-1 text-3xl text-[#73706C]">What travellers say</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                {[
                  ["Overall Rating", data.rating?.detailed?.overall ?? 4.8],
                  ["Cleanliness", data.rating?.detailed?.cleanliness ?? 4.8],
                  ["Amenities", data.rating?.detailed?.amenities ?? 4.5],
                  ["Check-in", data.rating?.detailed?.check_in ?? 4.5],
                  ["Access", data.rating?.detailed?.access ?? 4.5],
                  ["Location", data.rating?.detailed?.location ?? 5.0],
                  ["Value", data.rating?.detailed?.value ?? 4.5],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded bg-[#f8f3ef] p-3 text-center">
                    <p className="text-[11px] text-[#6a6763]">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-[#2f2b28]">{Number(value).toFixed(1)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  "The guided forest walks and birding sessions made this stay special. Rakesh's homestay feels like a true wildlife immersion.",
                  "Staying at this homestay was more than accommodation - it felt like stepping into the forest's rhythm.",
                  "The combination of stay and guided experiences made this trip memorable.",
                  "Simple rooms, warm hospitality, and amazing home-cooked meals.",
                ].map((content, idx) => (
                  <article key={idx} className="rounded bg-[#f8f3ef] p-4">
                    <div className="mb-2 inline-flex gap-1 text-[#e3bf5d]">
                      {Array.from({ length: 5 }).map((_, s) => <StarIcon key={`${idx}-${s}`} size={13} weight="fill" />)}
                    </div>
                    <p className="text-sm text-[#4b4844]">{content}</p>
                  </article>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                {data.map_url ? (
                  <a href={data.map_url} target="_blank" rel="noreferrer" className="rounded border border-[#2f2c29] px-4 py-2 text-sm text-[#2f2c29]">
                    View on Google
                  </a>
                ) : null}
                <button type="button" className="inline-flex items-center gap-2 rounded border border-[#2f2c29] px-4 py-2 text-sm text-[#2f2c29]">
                  Show all Reviews
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-[#AB863F] text-2xl font-semibold">Things to Know</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#FBF9F6] p-4">
                  <p className="font-semibold text-[#2F2B28]">Cancellation policy</p>
                  <p className="mt-2 text-sm text-[#4b4844]">
                    {data.policies?.cancellation?.free_cancellation ??
                      data.cancellation_policy ??
                      "Not specified."}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FBF9F6] p-4">
                  <p className="inline-flex items-center gap-2 font-semibold text-[#2F2B28]"><LockKeyIcon size={14} />House Rules</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-[#4b4844]">
                    {(data.policies?.house_rules && data.policies.house_rules.length > 0
                      ? data.policies.house_rules
                      : data.house_rules
                    ).map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-[#FBF9F6] p-4">
                  <p className="inline-flex items-center gap-2 font-semibold text-[#2F2B28]"><LockKeyIcon size={14} />Safety & property</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-[#4b4844]">
                    {(data.policies?.safety && data.policies.safety.length > 0
                      ? data.policies.safety
                      : data.safety_notes
                    ).map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
      <ShareLinkModal
        isOpen={isShareModalOpen}
        path={`/accommodations/${data.slug || data.id}`}
        title="Share homestay"
        onClose={() => setIsShareModalOpen(false)}
      />
    </main>
  );
}
