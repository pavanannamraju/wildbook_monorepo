import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BinocularsIcon,
  BookmarkSimpleIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  ClockIcon,
  CurrencyInrIcon,
  GlobeIcon,
  HouseSimpleIcon,
  MapPinIcon,
  ShareNetworkIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { addBookmark, fetchBookmarkStatuses, removeBookmark } from "../api/bookmarks";
import { fetchExpertById, type ExpertDetail, type ExperienceDetail } from "../api/experts";
import { useAuth } from "../auth/AuthProvider";
import { createInquiry } from "../api/inquiries";
import { PageLoader } from "../components/PageLoader";
import { PageErrorState } from "../components/common/PageErrorState";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { ExpertAvatar } from "../components/common/ExpertAvatar";
import { ExperienceDetailModal } from "../components/experts/ExperienceDetailModal";
import { StarRating } from "../components/common/StarRating";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";

function roleLabel(role: string): string {
  if (role === "guide") return "FOREST GUIDE";
  if (role === "naturalist") return "PRIVATE NATURALIST";
  return role.toUpperCase();
}

function durationLabel(experience: ExperienceDetail): string {
  const duration = experience.duration;
  if (!duration) return "Custom";
  const unit = duration.unit === "hours" ? "Hours" : duration.unit === "days" ? "Days" : duration.unit;
  return `${duration.value} ${unit}`;
}

export function ExpertDetailPage() {
  const { slugOrId } = useParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [activeImage, setActiveImage] = useState<{ url: string; title: string } | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [customGroupSize, setCustomGroupSize] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [expandedExperienceIds, setExpandedExperienceIds] = useState<Set<string>>(new Set());
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceDetail | null>(null);

  useEffect(() => {
    if (!slugOrId) {
      setStatus("error");
      setError("Missing expert identifier.");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    fetchExpertById(slugOrId, controller.signal)
      .then((result) => {
        setExpert(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load expert details.");
      });

    return () => controller.abort();
  }, [slugOrId]);

  useEffect(() => {
    if (!activeImage) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImage(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [activeImage]);

  const locationLabel = useMemo(() => {
    return expert?.location_name || expert?.location?.primary_location_id || null;
  }, [expert?.location_name, expert?.location?.primary_location_id]);

  const languageValues = useMemo(() => {
    if (!expert) return [];
    return expert.language_names.length > 0 ? expert.language_names : expert.language_ids;
  }, [expert]);

  useEffect(() => {
    if (!user || !expert) {
      setIsBookmarked(false);
      return;
    }
    const controller = new AbortController();
    fetchBookmarkStatuses("expert", [expert.id], controller.signal)
      .then((bookmarked) => { setIsBookmarked(bookmarked.has(expert.id)); })
      .catch(() => { if (!controller.signal.aborted) setIsBookmarked(false); });
    return () => controller.abort();
  }, [expert, user]);

  if (status === "loading") return <PageLoader />;
  if (status === "error" || !expert) {
    return <PageErrorState message={error ?? "Expert not found."} className="bg-[#F0EDE9]" />;
  }

  const primaryRole = expert.roles[0] ? roleLabel(expert.roles[0]) : "PRIVATE NATURALIST";
  const expertiseTags = expert.expertise_names.length > 0 ? expert.expertise_names : expert.expertise_ids;
  const experiences = expert.experiences_full ?? [];
  const testimonials = expert.testimonials_full ?? [];
  const fieldEntries = (expert.field_entries_full ?? []).filter(
    (item) => item.media_type === "image" && item.media_url,
  );
  const reviewsCount = experiences[0]?.reviews_count ?? 0;
  const groupSizeValue = groupSize === "custom" ? customGroupSize.trim() : groupSize;
  const firstName = expert.name.split(" ")[0];

  const validationErrors = (() => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName.trim()) errors.customerName = "Name is required.";
    if (!customerEmail.trim()) errors.customerEmail = "Email is required.";
    else if (!emailRegex.test(customerEmail.trim())) errors.customerEmail = "Enter a valid email.";
    if (!startDate) errors.startDate = "Start date is required.";
    if (!endDate) errors.endDate = "End date is required.";
    if (startDate && endDate && endDate < startDate) errors.endDate = "End date must be on or after start date.";
    if (!groupSizeValue) errors.groupSize = "Group size is required.";
    if (groupSize === "custom" && !/^\d+$/.test(groupSizeValue)) errors.groupSize = "Enter a valid number.";
    if (groupSize === "custom" && /^\d+$/.test(groupSizeValue) && Number(groupSizeValue) <= 0) {
      errors.groupSize = "Must be greater than zero.";
    }
    if (!enquiryMessage.trim()) errors.enquiryMessage = "Enquiry is required.";
    else if (enquiryMessage.trim().length < 10) errors.enquiryMessage = "At least 10 characters.";
    return errors;
  })();

  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleSubmitInquiry = async () => {
    setSubmitAttempted(true);
    if (!isFormValid) { setSubmitStatus("error"); setSubmitError("Please fix form errors."); return; }
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      await createInquiry({
        expert_id: expert.id,
        expert_name: expert.name,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        travel_dates: `${startDate} to ${endDate}`,
        group_size: groupSizeValue,
        enquiry_message: enquiryMessage.trim(),
        source: "expert_detail_form",
      });
      setSubmitStatus("success");
      setCustomerName(""); setCustomerEmail(""); setStartDate(""); setEndDate("");
      setGroupSize("2"); setCustomGroupSize(""); setEnquiryMessage(""); setSubmitAttempted(false);
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Failed to submit enquiry.");
    }
  };

  const toggleBookmark = async () => {
    if (!user || bookmarkPending) return;
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);
    setBookmarkPending(true);
    try {
      if (nextBookmarked) await addBookmark("expert", expert.id);
      else await removeBookmark("expert", expert.id);
    } catch {
      setIsBookmarked(!nextBookmarked);
    } finally {
      setBookmarkPending(false);
    }
  };

  const inputClass = "h-[64px] w-full rounded-[4px] bg-[#F6F4F0] px-[16px] font-['Nunito'] font-normal text-[20px] text-[#2F2B28] placeholder:text-[rgba(47,43,40,0.4)] outline-none";
  const labelClass = "font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]";

  return (
    <main className="mx-auto max-w-[1920px] bg-[#F6F4F0]">
      <StickyTopNavbar />

      <div className="page-px py-[88px]">
        <div className="flex gap-[80px]">

          {/* ── Left sidebar ── */}
          <aside className="w-[364px] shrink-0 lg:sticky lg:top-[88px] lg:self-start">
            {/* Back link */}
            <Link
              to="/experts"
              className="mb-[8px] inline-flex items-center gap-[10px] p-[8px] font-['Nunito'] font-normal text-[16px] text-[#73706C] hover:text-[#2F2B28] transition-colors"
            >
              <ArrowLeftIcon size={24} />
              Back to all experts
            </Link>

            <div className="flex flex-col gap-[16px]">
              {/* Photo */}
              <div className="h-[440px] w-full overflow-hidden rounded-[20px] bg-[#d7d3cf]">
                <ExpertAvatar src={expert.profile_image_url} alt={expert.name} iconSize={128} />
              </div>

              {/* Name + role */}
              <div className="flex flex-col gap-[8px]">
                <h1
                  className="text-[24px] leading-[32px] text-black"
                  style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
                >
                  {expert.name}
                </h1>
                <p className="font-['Nunito'] font-bold text-[16px] uppercase text-[#73706C]">
                  {primaryRole}
                </p>
              </div>

              {/* Rating row */}
              <div className="rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                <div className="flex items-center gap-[4px]">
                  <StarRating
                    rating={expert.experience_rating_max ?? 0}
                    size={32}
                    className="inline-flex gap-[4px] text-[#f0c165]"
                  />
                  <span className="font-['Nunito'] font-bold text-[22px] leading-[28px] text-[#2F2B28]">
                    {(expert.experience_rating_max ?? 0).toFixed(1)}
                  </span>
                  <span className="font-['Nunito'] font-light text-[22px] leading-[28px] text-[#73706C]">
                    ({reviewsCount} Reviews)
                  </span>
                </div>
              </div>

              {/* Homestay card — only if data exists */}
              {expert.homestay && (
                <div className="rounded-[4px] bg-[#F3EEE9] px-[24px] py-[16px]">
                  <div className="flex flex-col gap-[16px]">
                    <div className="flex items-center gap-[8px]">
                      <HouseSimpleIcon size={18} className="text-[#0B6E66]" />
                      <span className="font-['Nunito'] font-medium text-[16px] leading-[24px] text-[#0B6E66]">
                        Homestay by {firstName}
                      </span>
                    </div>
                    <p className="font-['Nunito'] font-normal text-[22px] leading-[28px] text-[#2F2B28]">
                      {expert.homestay.tagline ?? `Stay at ${firstName}'s home at the forest edge.`}
                    </p>
                    {expert.homestay.accommodation_id ? (
                      <Link
                        to={`/accommodations/${encodeURIComponent(expert.homestay.accommodation_id)}`}
                        className="flex h-[48px] w-full items-center justify-center gap-[10px] rounded-[4px] bg-[#0B6E66] font-['Nunito'] font-medium text-[18px] text-[#FAFAFA] hover:bg-[#074A46] transition-colors"
                      >
                        Explore the Homestay
                        <ArrowRightIcon size={24} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="min-w-0 flex-1 flex flex-col gap-[48px]">

            {/* About */}
            <div className="flex flex-col gap-[32px]">
              <div className="flex flex-col gap-[8px]">
                {/* Heading + actions row */}
                <div className="flex items-center justify-between">
                  <h2 className="font-['Nunito'] font-bold text-[28px] leading-[40px] text-[#AB863F]">
                    About
                  </h2>
                  <div className="flex items-center gap-[4px]">
                    <button
                      type="button"
                      onClick={() => void toggleBookmark()}
                      disabled={!user || bookmarkPending}
                      className="flex size-[48px] items-center justify-center rounded-full text-[#73706C] hover:bg-black/5 disabled:opacity-50 transition-colors"
                      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                      <BookmarkSimpleIcon size={24} weight={isBookmarked ? "fill" : "regular"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex size-[48px] items-center justify-center rounded-full text-[#73706C] hover:bg-black/5 transition-colors"
                      aria-label="Share expert profile"
                    >
                      <ShareNetworkIcon size={24} />
                    </button>
                  </div>
                </div>

                {/* Location + experience */}
                <div className="flex items-center gap-[24px]">
                  {locationLabel && (
                    <div className="flex items-center gap-[8px]">
                      <MapPinIcon size={24} className="shrink-0 text-[#2F2B28]" />
                      <span className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]">
                        {locationLabel}
                      </span>
                    </div>
                  )}
                  {locationLabel && expert.experience_years != null && (
                    <span className="h-[1px] self-stretch w-px bg-[#73706C] opacity-30" />
                  )}
                  {expert.experience_years != null && (
                    <div className="flex items-center gap-[8px]">
                      <BinocularsIcon size={24} className="shrink-0 text-[#2F2B28]" />
                      <span className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]">
                        {expert.experience_years} Years Experience
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {expert.bio?.summary && (
                <p className="font-['Nunito'] font-normal text-[22px] leading-[28px] text-[#2F2B28] text-justify">
                  {expert.bio.summary}
                </p>
              )}

              {/* Expertise + Languages */}
              {(expertiseTags.length > 0 || languageValues.length > 0) && (
                <div className="flex flex-wrap gap-[112px]">
                  {expertiseTags.length > 0 && (
                    <div className="flex flex-col gap-[14px]">
                      <h3 className="font-['Nunito'] font-bold text-[22px] leading-[28px] text-[#AB863F]">
                        Expertise
                      </h3>
                      <div className="flex flex-wrap gap-[16px]">
                        {expertiseTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-[4px] bg-[rgba(155,205,178,0.5)] px-[16px] py-[8px] font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {languageValues.length > 0 && (
                    <div className="flex flex-col gap-[14px]">
                      <h3 className="font-['Nunito'] font-bold text-[22px] leading-[28px] text-[#AB863F]">
                        Languages Known
                      </h3>
                      <div className="flex flex-wrap gap-[16px]">
                        {languageValues.map((lang) => (
                          <span
                            key={lang}
                            className="rounded-[4px] bg-[#D7D2CC] px-[16px] py-[8px] font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Curated Experiences */}
            {experiences.length > 0 && (
              <div className="flex flex-col gap-[16px]">
                <div>
                  <h3 className="font-['Nunito'] font-bold text-[24px] leading-[32px] text-[#AB863F]">
                    Curated Experiences
                  </h3>
                  <p
                    className="text-[24px] leading-[40px] text-[#73706C]"
                    style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 350 }}
                  >
                    Journeys with {firstName}
                  </p>
                </div>

                <div className="flex flex-col gap-[24px]">
                  {experiences.map((item) => {
                    const description = item.description ?? "";
                    const isExpanded = expandedExperienceIds.has(item.id);
                    const canExpand = description.length > 120;

                    return (
                      <article
                        key={item.id}
                        className="flex gap-[40px] items-start rounded-[16px] bg-[#FBF9F6] p-[16px]"
                      >
                        {/* Image */}
                        <div className="w-[349px] shrink-0 self-stretch overflow-hidden rounded-[8px] bg-[#E6E0D9]">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-[200px] w-full items-center justify-center text-sm text-[#857f79]">
                              No image
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 flex flex-col gap-[24px]">
                          <div className="flex flex-col gap-[24px]">
                            <div className="flex flex-col gap-[4px]">
                              <div className="flex flex-col gap-[16px]">
                                {/* Title + share */}
                                <div className="flex items-center justify-between">
                                  <h4
                                    className="text-[24px] leading-[32px] text-[#2F2B28]"
                                    style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
                                  >
                                    {item.title}
                                  </h4>
                                  <button
                                    type="button"
                                    className="flex size-[32px] items-center justify-center rounded-full text-[#73706C] hover:bg-black/5 transition-colors"
                                  >
                                    <ShareNetworkIcon size={24} />
                                  </button>
                                </div>

                                {/* Description — clipped, expandable */}
                                {description && (
                                  <div>
                                    <div
                                      className="overflow-hidden transition-all duration-300 ease-in-out"
                                      style={{ maxHeight: isExpanded || !canExpand ? "400px" : "58px" }}
                                    >
                                      <p className="font-['Nunito'] font-normal text-[22px] leading-[28px] text-[#2F2B28]">
                                        {description}
                                      </p>
                                    </div>
                                    {canExpand && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExpandedExperienceIds((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(item.id)) next.delete(item.id);
                                            else next.add(item.id);
                                            return next;
                                          });
                                        }}
                                        className="mt-[4px] inline-flex items-center border-b border-[#73706C] py-[4px] font-['Nunito'] font-normal text-[14px] text-[#73706C]"
                                      >
                                        {isExpanded ? "Show Less" : "Show More"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Detail tags */}
                              <div className="flex flex-wrap gap-[16px] items-center">
                                <div className="flex items-center gap-[10px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                                  <ClockIcon size={24} className="text-[#2F2B28]" />
                                  <span className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]">
                                    {durationLabel(item)}
                                  </span>
                                </div>
                                {(item.group_size?.min != null || item.group_size?.max != null) && (
                                  <div className="flex items-center gap-[10px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                                    <UsersThreeIcon size={24} className="text-[#2F2B28]" />
                                    <span className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]">
                                      {item.group_size?.min ?? 1} – {item.group_size?.max ?? 1}
                                    </span>
                                  </div>
                                )}
                                {item.pricing?.amount != null && (
                                  <div className="flex items-center gap-[10px] rounded-[4px] bg-[rgba(11,110,102,0.05)] px-[16px] py-[8px]">
                                    <CurrencyInrIcon size={24} className="text-[#2F2B28]" />
                                    <span className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#2F2B28]">
                                      {item.pricing.amount} / {item.pricing.per ?? "person"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* View Details button */}
                          <div>
                            <button
                              type="button"
                              className="inline-flex h-[40px] w-[192px] items-center justify-center gap-[10px] rounded-[4px] border-[0.8px] border-[#3B372F] bg-[rgba(243,239,234,0.01)] font-['Nunito'] font-medium text-[18px] text-[#3B372F] hover:bg-[#3B372F]/5 transition-colors"
                              onClick={() => setSelectedExperience(item)}
                            >
                              View Details
                              <ArrowRightIcon size={24} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div className="flex flex-col gap-[16px]">
                <div>
                  <h3 className="font-['Nunito'] font-bold text-[24px] leading-[32px] text-[#AB863F]">
                    Testimonials
                  </h3>
                  <p className="font-['Nunito'] font-bold text-[28px] leading-[40px] text-[#73706C]">
                    What travellers say
                  </p>
                </div>
                <div className="flex gap-[24px] overflow-x-auto pb-[8px]">
                  {testimonials.map((item) => (
                    <article
                      key={item.id}
                      className="flex h-[336px] w-[456px] shrink-0 flex-col justify-between rounded-[20px] bg-[#F3EEE9] px-[24px] py-[32px]"
                    >
                      <div className="flex flex-col gap-[24px]">
                        <div className="flex gap-[8px]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="size-[32px] text-[#e3bf5d]">★</span>
                          ))}
                        </div>
                        <p className="font-['Nunito'] font-normal text-[20px] leading-[28px] text-[#2F2B28]">
                          {item.content}
                        </p>
                      </div>
                      <div>
                        <p className="font-['Nunito'] font-medium text-[18px] leading-[24px] text-[#0B6E66]">
                          {item.author_name}
                        </p>
                        {item.author_location && (
                          <p className="font-['Nunito'] font-normal text-[14px] text-[#73706C]">
                            {item.author_location}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* From the Field */}
            {fieldEntries.length > 0 && (
              <div className="flex flex-col gap-[16px]">
                <div>
                  <h3 className="font-['Nunito'] font-bold text-[24px] leading-[32px] text-[#AB863F]">
                    From the Field
                  </h3>
                  <p className="font-['Nunito'] font-semibold text-[24px] leading-[32px] text-[#73706C]">
                    Visual stories, sightings, and experiences from the ground
                  </p>
                </div>
                <div className="grid grid-flow-col auto-cols-[200px] grid-rows-2 gap-[12px] overflow-x-auto pb-2 md:auto-cols-[240px]">
                  {fieldEntries.map((item) => (
                    <article
                      key={item.id}
                      className="h-[180px] overflow-hidden rounded-[4px] bg-[#d8d4cf] md:h-[210px]"
                      title={item.title}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveImage({ url: item.media_url, title: item.title })}
                        className="h-full w-full"
                      >
                        <img
                          src={item.media_url}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Enquiry form */}
            <section className="rounded-[16px] bg-[#FBF9F6] p-[32px]">
              <div className="flex flex-col gap-[32px]">
                <div className="flex flex-col gap-[16px]">
                  <h3 className="font-['Nunito'] font-bold text-[24px] leading-[32px] text-[#2F2B28]">
                    Make an Enquiry via Wildbook
                  </h3>
                  <p className="font-['Nunito'] font-normal text-[22px] leading-[28px] text-[#2F2B28] text-justify">
                    Not sure which experience is right for you? Have a question about timing, group size, or what to expect?
                    {" "}Send {firstName} a message — Wildbook will forward your enquiry within 24 hours.
                  </p>
                </div>

                <div className="flex flex-col gap-[16px]">
                  <div className="grid gap-[24px] md:grid-cols-2">
                    <label className="flex flex-col gap-[4px]">
                      <span className={labelClass}>Your Name <span className="text-[#D34747]">*</span></span>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={inputClass}
                      />
                      {submitAttempted && validationErrors.customerName && (
                        <p className="text-[12px] text-red-600">{validationErrors.customerName}</p>
                      )}
                    </label>
                    <label className="flex flex-col gap-[4px]">
                      <span className={labelClass}>Email <span className="text-[#D34747]">*</span></span>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className={inputClass}
                      />
                      {submitAttempted && validationErrors.customerEmail && (
                        <p className="text-[12px] text-red-600">{validationErrors.customerEmail}</p>
                      )}
                    </label>
                  </div>

                  <div className="grid gap-[24px] md:grid-cols-2">
                    <label className="flex flex-col gap-[4px]">
                      <span className={labelClass}>Start Date <span className="text-[#D34747]">*</span></span>
                      <div className="relative flex h-[64px] items-center rounded-[4px] bg-[#F6F4F0] px-[16px]">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-transparent pr-[40px] font-['Nunito'] text-[20px] text-[#2F2B28] outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarDotsIcon size={24} className="absolute right-[16px] pointer-events-none text-[#73706C]" />
                      </div>
                      {submitAttempted && validationErrors.startDate && (
                        <p className="text-[12px] text-red-600">{validationErrors.startDate}</p>
                      )}
                    </label>
                    <label className="flex flex-col gap-[4px]">
                      <span className={labelClass}>End Date <span className="text-[#D34747]">*</span></span>
                      <div className="relative flex h-[64px] items-center rounded-[4px] bg-[#F6F4F0] px-[16px]">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-transparent pr-[40px] font-['Nunito'] text-[20px] text-[#2F2B28] outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <CalendarDotsIcon size={24} className="absolute right-[16px] pointer-events-none text-[#73706C]" />
                      </div>
                      {submitAttempted && validationErrors.endDate && (
                        <p className="text-[12px] text-red-600">{validationErrors.endDate}</p>
                      )}
                    </label>
                  </div>

                  <div className="grid gap-[24px] md:grid-cols-2">
                    <label className="flex flex-col gap-[4px]">
                      <span className={labelClass}>Number of People <span className="text-[#D34747]">*</span></span>
                      <div className="flex h-[64px] items-center justify-between rounded-[4px] bg-[#F6F4F0] px-[16px]">
                        <select
                          value={groupSize}
                          onChange={(e) => setGroupSize(e.target.value)}
                          className="w-full appearance-none bg-transparent font-['Nunito'] text-[20px] text-[#2F2B28] outline-none"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6+">6+</option>
                          <option value="custom">Custom</option>
                        </select>
                        <CaretDownIcon size={32} className="shrink-0 text-[#343330]" />
                      </div>
                      {submitAttempted && validationErrors.groupSize && (
                        <p className="text-[12px] text-red-600">{validationErrors.groupSize}</p>
                      )}
                    </label>
                    {groupSize === "custom" ? (
                      <label className="flex flex-col gap-[4px]">
                        <span className={labelClass}>Custom Count <span className="text-[#D34747]">*</span></span>
                        <input
                          type="number"
                          min={1}
                          value={customGroupSize}
                          onChange={(e) => setCustomGroupSize(e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    ) : <div />}
                  </div>

                  <label className="flex flex-col gap-[4px]">
                    <span className={labelClass}>Your Enquiry <span className="text-[#D34747]">*</span></span>
                    <textarea
                      placeholder={`Tell ${firstName} about your visit — your interests, what you're hoping to see...`}
                      rows={4}
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      className="w-full rounded-[4px] bg-[#F6F4F0] px-[16px] py-[14px] font-['Nunito'] font-normal text-[20px] text-[#2F2B28] placeholder:text-[rgba(47,43,40,0.4)] outline-none"
                    />
                    {submitAttempted && validationErrors.enquiryMessage && (
                      <p className="text-[12px] text-red-600">{validationErrors.enquiryMessage}</p>
                    )}
                  </label>
                </div>

                <div className="flex flex-col items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => void handleSubmitInquiry()}
                    disabled={submitStatus === "submitting" || !isFormValid}
                    className="h-[56px] w-full rounded-[4px] bg-[#0B6E66] font-['Nunito'] font-medium text-[18px] text-[#FAFAFA] hover:bg-[#074A46] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {submitStatus === "submitting" ? "Submitting..." : "Submit Enquiry"}
                  </button>
                  {submitStatus === "success" && (
                    <p className="font-['Nunito'] text-[14px] text-[#0B6E66]">
                      Enquiry submitted. Our team will get back to you shortly.
                    </p>
                  )}
                  {submitStatus === "error" && submitError && (
                    <p className="font-['Nunito'] text-[14px] text-red-600">{submitError}</p>
                  )}
                  <p className="font-['Nunito'] font-normal text-[16px] text-[#73706C] text-center">
                    This is an enquiry, not a booking. Once you connect, you can choose to reserve directly through Wildbook.
                  </p>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>

      {/* Lightbox */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActiveImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              onClick={() => setActiveImage(null)}
              aria-label="Close image preview"
            >
              <XIcon size={20} />
            </button>
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      <ShareLinkModal
        isOpen={isShareModalOpen}
        path={`/experts/${expert.slug || expert.id}`}
        title="Share expert profile"
        onClose={() => setIsShareModalOpen(false)}
      />

      <ExperienceDetailModal
        isOpen={selectedExperience !== null}
        experience={selectedExperience}
        guideId={expert.id}
        guideFirstName={firstName}
        onClose={() => setSelectedExperience(null)}
      />
    </main>
  );
}
