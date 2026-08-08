import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyInrIcon,
  HouseSimpleIcon,
  MapPinIcon,
  ShareNetworkIcon,
  TranslateIcon,
  TreeEvergreenIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { addBookmark, fetchBookmarkStatuses, removeBookmark } from "../api/bookmarks";
import { fetchExpertById, type ExpertDetail, type ExperienceDetail } from "../api/experts";
import { useAuth } from "../auth/AuthProvider";
import { PageLoader } from "../components/PageLoader";
import { PageErrorState } from "../components/common/PageErrorState";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { ExpertAvatar } from "../components/common/ExpertAvatar";
import { ExperienceDetailModal } from "../components/experts/ExperienceDetailModal";
import { ExpertInquiryForm } from "../components/experts/ExpertInquiryForm";
import { durationLabel, roleLabel } from "../components/experts/labels";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";
import { track } from "../lib/analytics";

export function ExpertDetailPage() {
  const { slugOrId } = useParams();
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [activeImage, setActiveImage] = useState<{ url: string; title: string } | null>(null);
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
    window.scrollTo(0, 0);

    fetchExpertById(slugOrId, controller.signal)
      .then((result) => {
        setExpert(result);
        setStatus("success");
        track("expert_detail_view", {
          expert_id: result.id,
          slug: result.slug || null,
        });
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
      .then((bookmarked) => {
        setIsBookmarked(bookmarked.has(expert.id));
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsBookmarked(false);
      });
    return () => controller.abort();
  }, [expert, user]);

  if (status === "loading") return <PageLoader />;
  if (status === "error" || !expert) {
    return <PageErrorState message={error ?? "Expert not found."} className="bg-[#F6F4F1]" />;
  }

  const primaryRole = expert.roles[0] ? roleLabel(expert.roles[0]) : "Naturalist";
  const expertiseTags = expert.expertise_names.length > 0 ? expert.expertise_names : expert.expertise_ids;
  const experiences = expert.experiences_full ?? [];
  const testimonials = expert.testimonials_full ?? [];
  const fieldEntries = (expert.field_entries_full ?? []).filter(
    (item) => item.media_type === "image" && item.media_url,
  );
  const firstName = expert.name.split(" ")[0];
  const toggleBookmark = async () => {
    if (!user || bookmarkPending) return;
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);
    setBookmarkPending(true);
    try {
      if (nextBookmarked) await addBookmark("expert", expert.id);
      else await removeBookmark("expert", expert.id);
      track("expert_bookmark_toggle", {
        expert_id: expert.id,
        is_bookmarked: nextBookmarked,
      });
    } catch {
      setIsBookmarked(!nextBookmarked);
    } finally {
      setBookmarkPending(false);
    }
  };

  const cardClass = "rounded-2xl border border-[#E3DDD8] bg-white p-6 sm:p-8";

  return (
    <div className="min-h-screen bg-[#F6F4F1] pb-24">
      <StickyTopNavbar />

      <div className="container mx-auto mb-12 px-4 pt-6 lg:px-8">
        <Link
          to="/experts"
          className="mb-8 inline-flex items-center gap-2 font-['Nunito'] text-sm text-[#73706C] transition-colors hover:text-[#3B372F]"
        >
          <ArrowLeftIcon size={18} />
          Back to all experts
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* ── Main column ── */}
          <div className="space-y-10 lg:col-span-8">
            {/* Header — matches zip: photo beside name */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-start gap-8 md:flex-row"
            >
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#E8E2DC] shadow-lg md:h-48 md:w-48">
                <ExpertAvatar src={expert.profile_image_url} alt={expert.name} iconSize={72} />
              </div>

              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-['Montserrat'] text-3xl font-bold text-[#3B372F] md:text-4xl">
                    {expert.name}
                  </h1>
                  <CheckCircleIcon size={24} className="text-[#0B6E66]" weight="fill" />
                </div>
                <p className="mb-4 font-['Nunito'] text-xl font-semibold text-[#0B6E66]">{primaryRole}</p>

                {locationLabel ? (
                  <div className="mb-6 flex items-center gap-2 font-['Nunito'] text-[#73706C]">
                    <MapPinIcon size={20} />
                    <span>{locationLabel}</span>
                  </div>
                ) : (
                  <div className="mb-6" />
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      track("expert_enquiry_focus", { expert_id: expert.id });
                      const input = document.getElementById("enquiry-name");
                      if (!(input instanceof HTMLInputElement)) return;
                      // Focus only — browser scrolls only if the field is off-screen (mobile).
                      input.focus();
                    }}
                    className="rounded-sm bg-[#0B6E66] px-8 py-2.5 font-['Nunito'] text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
                  >
                    Send Enquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsShareModalOpen(true);
                      track("expert_share_open", { expert_id: expert.id });
                    }}
                    className="inline-flex items-center gap-2 rounded-sm border border-[#0B6E66] px-6 py-2.5 font-['Nunito'] text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#0B6E66]/5"
                  >
                    <ShareNetworkIcon size={16} />
                    Share Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleBookmark()}
                    disabled={!user || bookmarkPending}
                    className="inline-flex items-center gap-2 rounded-sm border border-[#E3DDD8] px-4 py-2.5 font-['Nunito'] text-sm font-semibold text-[#3B372F] transition-colors hover:bg-black/5 disabled:opacity-50"
                    aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <BookmarkSimpleIcon size={16} weight={isBookmarked ? "fill" : "regular"} className={isBookmarked ? "text-[#0B6E66]" : undefined} />
                    {isBookmarked ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Homestay */}
            {expert.homestay ? (
              <section className={`${cardClass} border-[#0B6E66]/20 bg-[#0B6E66]/5`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <HouseSimpleIcon size={22} className="mt-0.5 shrink-0 text-[#0B6E66]" />
                    <div>
                      <p className="font-['Nunito'] font-semibold text-[#0B6E66]">Homestay by {firstName}</p>
                      <p className="mt-1 font-['Nunito'] text-sm text-[#3B372F]">
                        {expert.homestay.tagline ?? `Stay at ${firstName}'s home at the forest edge.`}
                      </p>
                    </div>
                  </div>
                  {expert.homestay.accommodation_id ? (
                    <Link
                      to={`/accommodations/${encodeURIComponent(expert.homestay.accommodation_id)}`}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#0B6E66] px-5 font-['Nunito'] text-sm font-semibold text-white hover:bg-[#095B54]"
                    >
                      Explore the Homestay
                      <ArrowRightIcon size={16} />
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* About */}
            <section className={cardClass}>
              <h2 className="mb-4 font-['Montserrat'] text-2xl font-bold text-[#3B372F]">About</h2>
              {expert.bio?.summary ? (
                <p className="font-['Nunito'] leading-relaxed text-[#73706C]">{expert.bio.summary}</p>
              ) : (
                <p className="font-['Nunito'] leading-relaxed text-[#9AA59D]">Bio coming soon.</p>
              )}
            </section>

            {/* Expertise & Languages */}
            {(expertiseTags.length > 0 || languageValues.length > 0) && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {expertiseTags.length > 0 ? (
                  <section className={cardClass}>
                    <h2 className="mb-4 flex items-center gap-2 font-['Montserrat'] text-xl font-bold text-[#3B372F]">
                      <TreeEvergreenIcon size={24} className="text-[#0B6E66]" />
                      Expertise
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {expertiseTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-[#E8F4F2] px-3 py-1.5 font-['Nunito'] text-sm font-semibold text-[#0B6E66]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {languageValues.length > 0 ? (
                  <section className={cardClass}>
                    <h2 className="mb-4 flex items-center gap-2 font-['Montserrat'] text-xl font-bold text-[#3B372F]">
                      <TranslateIcon size={24} className="text-[#0B6E66]" />
                      Languages
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {languageValues.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-lg bg-[#F0EDE9] px-3 py-1.5 font-['Nunito'] text-sm text-[#5A6B60]"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}

            {/* Experiences */}
            {experiences.length > 0 ? (
              <section className="space-y-5">
                <div>
                  <h2 className="font-['Montserrat'] text-2xl font-bold text-[#3B372F]">Curated Experiences</h2>
                  <p className="font-['Nunito'] text-sm text-[#73706C]">Journeys with {firstName}</p>
                </div>
                <div className="flex flex-col gap-5">
                  {experiences.map((item) => {
                    const description = item.description ?? "";
                    const isExpanded = expandedExperienceIds.has(item.id);
                    const canExpand = description.length > 120;
                    return (
                      <article key={item.id} className={`flex flex-col gap-4 md:flex-row ${cardClass}`}>
                        <div className="h-48 w-full shrink-0 overflow-hidden rounded-xl bg-[#E8E2DC] md:h-auto md:w-56">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-40 items-center justify-center text-sm text-[#9AA59D]">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <h3 className="font-['Montserrat'] text-lg font-bold text-[#3B372F]">{item.title}</h3>
                          {description ? (
                            <div>
                              <p
                                className={`font-['Nunito'] text-sm leading-relaxed text-[#73706C] ${
                                  !isExpanded && canExpand ? "line-clamp-2" : ""
                                }`}
                              >
                                {description}
                              </p>
                              {canExpand ? (
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
                                  className="mt-1 font-['Nunito'] text-xs font-semibold text-[#0B6E66] hover:underline"
                                >
                                  {isExpanded ? "Show less" : "Show more"}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F4F2] px-2.5 py-1 font-['Nunito'] text-xs font-medium text-[#0B6E66]">
                              <ClockIcon size={14} />
                              {durationLabel(item) ?? "Custom"}
                            </span>
                            {(item.group_size?.min != null || item.group_size?.max != null) && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F4F2] px-2.5 py-1 font-['Nunito'] text-xs font-medium text-[#0B6E66]">
                                <UsersThreeIcon size={14} />
                                {item.group_size?.min ?? 1}–{item.group_size?.max ?? 1}
                              </span>
                            )}
                            {item.pricing?.amount != null ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F4F2] px-2.5 py-1 font-['Nunito'] text-xs font-medium text-[#0B6E66]">
                                <CurrencyInrIcon size={14} />
                                {item.pricing.amount}/{item.pricing.per ?? "person"}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedExperience(item)}
                              className="inline-flex items-center gap-2 rounded-sm border border-[#3B372F] px-4 py-2 font-['Nunito'] text-sm font-semibold text-[#3B372F] hover:bg-[#3B372F]/5"
                            >
                              View Details
                              <ArrowRightIcon size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Testimonials — no star ratings */}
            {testimonials.length > 0 ? (
              <section className="space-y-5">
                <h2 className="font-['Montserrat'] text-2xl font-bold text-[#3B372F]">
                  Traveller Experiences
                </h2>
                <div className="space-y-4">
                  {testimonials.map((item) => (
                    <article key={item.id} className={cardClass}>
                      <p className="mb-4 font-['Nunito'] text-[#3B372F] italic">“{item.content}”</p>
                      <div>
                        <p className="font-['Nunito'] text-sm font-bold text-[#3B372F]">{item.author_name}</p>
                        {item.author_location ? (
                          <p className="font-['Nunito'] text-xs text-[#73706C]">{item.author_location}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Field gallery */}
            {fieldEntries.length > 0 ? (
              <section className="space-y-5">
                <h2 className="font-['Montserrat'] text-2xl font-bold text-[#3B372F]">In the Field</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {fieldEntries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveImage({ url: item.media_url, title: item.title })}
                      className="aspect-square overflow-hidden rounded-xl bg-[#E8E2DC]"
                    >
                      <img
                        src={item.media_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* ── Sticky sidebar ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <ExpertInquiryForm
                expertId={expert.id}
                expertName={expert.name}
                firstName={firstName ?? ""}
                defaultName={profile?.full_name ?? user?.displayName ?? ""}
                defaultEmail={profile?.email ?? user?.email ?? ""}
                cardClassName={cardClass}
              />

              {/* Trust note — no star ratings */}
              <section className="rounded-2xl border border-dashed border-[#E3DDD8] bg-[#F0EDE9]/60 p-6 text-center">
                <p className="font-['Nunito'] text-sm text-[#73706C]">
                  Wildbook verifies all experts to ensure responsible tourism practices and authentic
                  experiences.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {activeImage ? (
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
              className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
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
      ) : null}

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
        guideFirstName={firstName ?? ""}
        onClose={() => setSelectedExperience(null)}
      />
    </div>
  );
}
