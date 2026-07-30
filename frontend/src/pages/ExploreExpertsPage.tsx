import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  XIcon,
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CircleNotchIcon,
  FunnelSimpleIcon,
  GlobeIcon,
  HouseSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ShareNetworkIcon,
  SignInIcon,
} from "@phosphor-icons/react";

import heroImage from "../assets/Explore_experts_Banner.png";
import { addBookmark, removeBookmark } from "../api/bookmarks";
import { useAuth } from "../auth/AuthProvider";
import { LoginModalContent } from "../components/auth/LoginModalContent";
import Navbar from "../components/Navbar";
import { PageLoader } from "../components/PageLoader";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { StickyHeader } from "../components/StickyHeader";
import { ExpertAvatar } from "../components/common/ExpertAvatar";
import { StarRating } from "../components/common/StarRating";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useScrollPastRef } from "../hooks/useScrollPastRef";
import { useExperts } from "../hooks/useExperts";

const FIRST_FREE_EXPERT_KEY = "wildbook_guest_first_expert_detail";
const SEARCH_DEBOUNCE_MS = 300;

function areSetsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

function roleLabel(role: string): string {
  if (role === "guide") return "FOREST GUIDE";
  if (role === "naturalist") return "NATURALIST";
  return role.toUpperCase();
}

export function ExploreExpertsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const isPastHero = useScrollPastRef(heroRef);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roleFilter, setRoleFilter] = useState<"all" | "guide" | "naturalist">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [showExploreLoginGate, setShowExploreLoginGate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingExpertPath, setPendingExpertPath] = useState<string | null>(null);
  const [bookmarkedExpertIds, setBookmarkedExpertIds] = useState<Set<string>>(new Set());
  const [bookmarkingExpertIds, setBookmarkingExpertIds] = useState<Set<string>>(new Set());
  const [sharePath, setSharePath] = useState<string | null>(null);
  const { status, data, error, isInitialLoading, isRefetching, nextPage, prevPage, goToPage, stats, pageSize } =
    useExperts({
      role: roleFilter,
      search: debouncedSearch,
      includeBookmark: Boolean(user),
    });

  const totalPages = stats.totalPages;
  const currentPage = stats.currentPage;
  const paged = data;
  const rangeStart = paged.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = paged.length === 0 ? 0 : rangeStart + paged.length - 1;
  const isSearchPending = search !== debouncedSearch;
  const isListRefreshing = isSearchPending || isRefetching;

  const handleViewDetails = (expertPath: string) => {
    if (user) {
      navigate(expertPath);
      return;
    }

    const nextExpertId = expertPath.replace("/experts/", "");
    const firstViewedExpert = window.localStorage.getItem(FIRST_FREE_EXPERT_KEY);
    if (!firstViewedExpert) {
      window.localStorage.setItem(FIRST_FREE_EXPERT_KEY, nextExpertId);
      navigate(expertPath);
      return;
    }

    if (firstViewedExpert === nextExpertId) {
      navigate(expertPath);
      return;
    }

    setPendingExpertPath(expertPath);
    setShowExploreLoginGate(true);
  };

  useEffect(() => {
    if (data.length === 0) {
      setBookmarkedExpertIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }
    const nextBookmarkedExpertIds = new Set(
      data.filter((item) => item.is_bookmarked === true).map((item) => item.id),
    );
    setBookmarkedExpertIds((prev) =>
      areSetsEqual(prev, nextBookmarkedExpertIds) ? prev : nextBookmarkedExpertIds,
    );
  }, [data]);

  const toggleBookmark = async (expertId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (bookmarkingExpertIds.has(expertId)) return;
    const isBookmarked = bookmarkedExpertIds.has(expertId);

    setBookmarkingExpertIds((prev) => new Set(prev).add(expertId));
    setBookmarkedExpertIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) {
        next.delete(expertId);
      } else {
        next.add(expertId);
      }
      return next;
    });

    try {
      if (isBookmarked) {
        await removeBookmark("expert", expertId);
      } else {
        await addBookmark("expert", expertId);
      }
    } catch {
      setBookmarkedExpertIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) {
          next.add(expertId);
        } else {
          next.delete(expertId);
        }
        return next;
      });
    } finally {
      setBookmarkingExpertIds((prev) => {
        const next = new Set(prev);
        next.delete(expertId);
        return next;
      });
    }
  };

  const pillClass = (active: boolean) =>
    `h-[48px] rounded-[4px] px-[24px] font-['Nunito'] font-medium text-[15px] lg:text-[18px] transition-colors ${
      active
        ? "bg-[#0B6E66] text-[#FAFAFA]"
        : "border-[0.5px] border-[#73706C] bg-[rgba(243,239,234,0.01)] text-[#6B6B6B] hover:text-[#2F2B28]"
    }`;

  const pageButtonClass = (active: boolean) =>
    `flex size-[32px] items-center justify-center rounded-[4px] font-bold text-[14px] ${
      active
        ? "bg-[#fbf9f6] border border-[#0b6e66] text-[#0b6e66]"
        : "bg-[#f3eee9] border border-[#dfe3e8] text-[#73706c]"
    }`;

  return (
    <main className="mx-auto max-w-[1920px]">
      <StickyHeader visible={isPastHero} />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden bg-[#2f2b28]">
        <img
          src={heroImage}
          alt=""
          className="block h-auto w-full select-none"
        />

        {/* Gradients matching Figma */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(47,43,40,0.72)_0%,rgba(47,43,40,0.30)_28%,rgba(47,43,40,0)_58%)]" />
        <div className="absolute inset-x-0 top-0 h-[155px] bg-[linear-gradient(180deg,rgba(47,43,40,0.48)_0%,rgba(47,43,40,0)_100%)] mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 h-[385px] bg-[linear-gradient(180deg,rgba(47,43,40,0)_0%,rgba(47,43,40,0.72)_100%)] mix-blend-multiply" />

        <div className="absolute inset-0 z-10 flex flex-col">
          <Navbar variant="light" />

          {/* Hero text — vertically centered within the banner */}
          <div className="flex flex-1 items-center page-px py-12">
            <div className="max-w-[452px]">
            <h1
              className="text-[38px] leading-[1.2] text-[rgba(232,226,220,0.9)] drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] md:text-[46px] md:leading-[60px] lg:text-[56px] lg:leading-[72px]"
              style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
            >
              Meet India&apos;s Guardians of Coexistence
            </h1>
            <p className="mt-[16px] font-['Nunito'] font-bold text-[16px] leading-[1.4] text-[#9bcdb2] md:text-[18px] lg:text-[24px] lg:leading-[32px]">
              A curated network of India&apos;s most knowledgeable guides and naturalists, offering
              rare access to local expertise across diverse landscapes.
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── List section ── */}
      <section className="bg-[#F6F4F0] page-px pt-[56px] pb-[40px] lg:pt-[32px] lg:pb-[48px]">

        {/* Title + count row */}
        <div className="mb-[16px] flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-['Nunito'] font-bold text-[20px] lg:text-[28px] lg:leading-[40px] text-[#2F2B28]">
            Explore Verified Forest Guides &amp; Naturalists
          </h2>
          <p className="font-['Nunito'] font-light text-[13px] lg:text-[16px] lg:leading-[32px] text-[#73706C]">
            {stats.totalCount > 0
              ? `Showing ${rangeStart}\u2013${rangeEnd} of ${stats.totalCount} experts`
              : "No experts found"}
          </p>
        </div>

        {/* Filter + search bar */}
        <div className="mb-[32px] flex flex-wrap items-center justify-between gap-[16px]">
          {/* Role pills */}
          <div className="flex gap-[16px]">
            <button type="button" onClick={() => setRoleFilter("all")}
              className={pillClass(roleFilter === "all")}>All</button>
            <button type="button" onClick={() => setRoleFilter("guide")}
              className={pillClass(roleFilter === "guide")}>Guides</button>
            <button type="button" onClick={() => setRoleFilter("naturalist")}
              className={pillClass(roleFilter === "naturalist")}>Naturalists</button>
          </div>

          {/* Search + Filter — Figma: w-560 search, gap-16 between */}
          <div className="flex gap-[16px]">
            <div className="flex h-[48px] w-full min-w-[200px] max-w-[560px] items-center gap-[16px] rounded-[4px] bg-[rgba(115,112,108,0.1)] px-[24px]">
              {isListRefreshing ? (
                <CircleNotchIcon
                  size={20}
                  className="shrink-0 animate-spin text-[#0B6E66]"
                  aria-hidden="true"
                />
              ) : (
                <MagnifyingGlassIcon size={20} className="shrink-0 text-[#73706C]" />
              )}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                aria-busy={isListRefreshing}
                className="w-full bg-transparent font-['Nunito'] font-normal text-[14px] lg:text-[16px] text-[#2F2B28] outline-none placeholder:text-[#73706C]"
              />
            </div>
            <button type="button"
              className="inline-flex h-[48px] items-center gap-[16px] rounded-[4px] bg-[rgba(115,112,108,0.1)] px-[24px] font-['Nunito'] font-normal text-[14px] lg:text-[16px] text-[#2F2B28] whitespace-nowrap">
              <FunnelSimpleIcon size={20} />
              Filter
            </button>
          </div>
        </div>

        {/* Error state */}
        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {/* Cards grid — Figma: 2-col, gap-[32px] */}
        {isInitialLoading ? (
          <PageLoader />
        ) : (
          <div
            className={`relative grid grid-cols-1 gap-[32px] transition-opacity lg:grid-cols-2 ${
              isListRefreshing ? "pointer-events-none opacity-60" : ""
            }`}
            aria-busy={isListRefreshing}
          >
            {paged.map((expert) => {
              const expertPath = `/experts/${expert.slug || expert.id}`;
              const isBookmarked = bookmarkedExpertIds.has(expert.id);
              const isBookmarkPending = bookmarkingExpertIds.has(expert.id);
              const primaryRole = expert.roles[0] ? roleLabel(expert.roles[0]) : "NATURALIST";
              const location =
                expert.location_name ?? expert.location_primary_location_id ?? "India Wildlife Reserve";
              const languageValues = expert.language_names.length > 0 ? expert.language_names : expert.language_ids;
              const languages = languageValues.slice(0, 4).join(", ");
              const tagValues = expert.expertise_names.length > 0 ? expert.expertise_names : expert.expertise_ids;
              const tags = tagValues.slice(0, 3);
              const reviewCount = expert.experience_snapshots[0]?.reviews_count ?? 0;

              return (
                <article key={expert.id} className="flex gap-[24px] rounded-[16px] bg-[#F3EEE9] p-[24px]">
                  {/* Photo — Figma: 272×312 rounded-[10px] */}
                  <div className="relative h-[312px] w-[272px] shrink-0 overflow-hidden rounded-[10px] bg-[#0B6E66]/20">
                    <ExpertAvatar src={expert.profile_image_url} alt={expert.name} iconSize={96} lazy />
                  </div>

                  {/* Right column — spread across photo height, tight internal grouping */}
                  <div className="min-w-0 flex-1 self-stretch flex flex-col justify-between">

                    {/* Top: name row + role row (tight gap between name and role) */}
                    <div className="flex flex-col gap-[2px]">
                      {/* Name + actions */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-['Nunito'] font-bold text-[20px] lg:text-[22px] leading-[32px] text-[#2F2B28]">
                          {expert.name}
                        </h3>
                        <div className="flex items-center gap-[4px] text-[#73706C] shrink-0">
                          <button
                            type="button"
                            onClick={() => void toggleBookmark(expert.id)}
                            disabled={isBookmarkPending}
                            className="flex size-[40px] items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-50 transition-colors"
                            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                          >
                            <BookmarkSimpleIcon size={24} weight={isBookmarked ? "fill" : "regular"} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSharePath(expertPath)}
                            className="flex size-[48px] items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                            aria-label="Share expert"
                          >
                            <ShareNetworkIcon size={24} />
                          </button>
                        </div>
                      </div>

                      {/* Role + homestay */}
                      <div className="flex items-center gap-[4px] flex-wrap">
                        <span className="font-['Nunito'] font-medium text-[13px] lg:text-[14px] uppercase text-[#73706C]">
                          {primaryRole}
                        </span>
                        {/* <span className="text-[#73706C] opacity-40 mx-[4px]">|</span>
                        <span className="flex items-center gap-[4px] text-[#0B6E66]">
                          <HouseSimpleIcon size={16} />
                          <span className="font-['Nunito'] font-medium text-[13px] lg:text-[16px] uppercase">
                            HOMESTAY HOST
                          </span>
                        </span> */}
                      </div>
                    </div>

                    {/* Middle: location + language */}
                    <div className="flex flex-col gap-[8px]">
                      <div className="flex gap-[16px] items-center">
                        <MapPinIcon size={20} className="shrink-0 text-[#2F2B28]" />
                        <span className="font-['Nunito'] font-medium text-[13px] lg:text-[18px] leading-[24px] text-[#2F2B28]">
                          {location}
                        </span>
                      </div>
                      <div className="flex gap-[16px] items-center">
                        <GlobeIcon size={20} className="shrink-0 text-[#2F2B28]" />
                        <span className="font-['Nunito'] font-medium text-[13px] lg:text-[18px] leading-[24px] text-[#2F2B28]">
                          {languages || "English, Hindi"}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-x-[8px] gap-y-[4px]">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[4px] bg-[rgba(155,205,178,0.5)] px-[16px] py-[8px] font-['Nunito'] font-medium text-[12px] lg:text-[16px] leading-[24px] text-[#2F2B28]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom: rating + CTA button */}
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex gap-[16px] items-center">
                        <StarRating
                          rating={expert.experience_rating_max ?? 0}
                          size={24}
                          className="inline-flex gap-[8px] text-[#f0c165]"
                        />
                        <span className="font-['Nunito'] font-light text-[13px] lg:text-[18px] leading-[24px] text-[#73706C]">
                          ({reviewCount})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(expertPath)}
                        className="inline-flex h-[48px] w-full items-center justify-center gap-[10px] rounded-[4px] bg-[#0B6E66] font-['Nunito'] font-medium text-[14px] lg:text-[18px] text-[#FAFAFA] hover:bg-[#074A46] transition-colors"
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
        )}

        {/* Pagination — Figma: size-[32px] buttons, gap-[8px] */}
        {totalPages > 1 && (
          <div className="mt-[40px] flex items-center justify-center gap-[8px]">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => void prevPage()}
              className="flex size-[32px] items-center justify-center rounded-[4px] bg-[rgba(59,55,47,0.4)] text-white disabled:opacity-50 hover:bg-[rgba(59,55,47,0.55)] transition-opacity"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(8, totalPages) }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => void goToPage(value)}
                  className={pageButtonClass(currentPage === value)}
                >
                  {value}
                </button>
              );
            })}
            {totalPages > 8 && (
              <span className="flex size-[32px] items-center justify-center rounded-[4px] bg-[#f3eee9] border border-[#dfe3e8] font-bold text-[14px] text-[#73706c]">
                ...
              </span>
            )}
            {totalPages > 8 && (
              <>
                <button type="button" onClick={() => void goToPage(totalPages - 1)}
                  className={pageButtonClass(currentPage === totalPages - 1)}>
                  {totalPages - 1}
                </button>
                <button type="button" onClick={() => void goToPage(totalPages)}
                  className={pageButtonClass(currentPage === totalPages)}>
                  {totalPages}
                </button>
              </>
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => void nextPage()}
              className="flex size-[32px] items-center justify-center rounded-[4px] bg-[rgba(59,55,47,0.4)] text-white disabled:opacity-50 hover:bg-[rgba(59,55,47,0.55)] transition-opacity"
            >
              ›
            </button>
          </div>
        )}
      </section>

      {/* Login gate modal */}
      {showExploreLoginGate
        ? createPortal(
            <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/55 p-4">
              <div className="w-full max-w-[760px] rounded-[16px] border border-white/20 bg-[#2f2d2a] px-8 py-9 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[620px]">
                    <h2
                      className="text-[24px] leading-none tracking-[-0.02em]"
                      style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
                    >
                      <span aria-hidden="true" className="mr-3 inline-block align-middle">
                        <SignInIcon />
                      </span>
                      Discover more about our experts
                    </h2>
                    <p className="mt-5 text-[22px] leading-[1.55] text-white/90 md:text-[20px]">
                      Log in or create an account to explore detailed profiles, experience offerings, and
                      availability of wildlife guides and naturalists.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
                    onClick={() => { setShowExploreLoginGate(false); setPendingExpertPath(null); }}
                    aria-label="Close access prompt"
                  >
                    <XIcon size={22} />
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="rounded-md border border-white/45 px-4 py-2 text-[12px] leading-none"
                    style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
                    onClick={() => { setShowExploreLoginGate(false); setPendingExpertPath(null); }}
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 rounded-md bg-[#0B6E66] px-4 py-2 text-[12px] leading-none"
                    style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
                    onClick={() => { setShowExploreLoginGate(false); setShowLoginModal(true); }}
                  >
                    Login / Sign Up
                    <ArrowRightIcon size={24} />
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Login modal */}
      {showLoginModal
        ? createPortal(
            <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/50 p-4">
              <div className="absolute inset-0" onClick={() => setShowLoginModal(false)} />
              <div className="relative z-1 w-full max-w-[1120px]">
                <LoginModalContent
                  onClose={() => setShowLoginModal(false)}
                  onSuccess={() => {
                    setShowLoginModal(false);
                    if (pendingExpertPath) {
                      navigate(pendingExpertPath);
                      setPendingExpertPath(null);
                    }
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      <ShareLinkModal
        isOpen={sharePath !== null}
        path={sharePath ?? "/experts"}
        title="Share expert profile"
        onClose={() => setSharePath(null)}
      />
    </main>
  );
}
