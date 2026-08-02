import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  XIcon,
  ArrowRightIcon,
  CircleNotchIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  SignInIcon,
} from "@phosphor-icons/react";

import expertsDesktop from "../assets/heroes/experts-desktop.png";
import expertsMobile from "../assets/heroes/experts-mobile.png";
import expertsTablet from "../assets/heroes/experts-tablet.png";
import { addBookmark, removeBookmark } from "../api/bookmarks";
import { useAuth } from "../auth/AuthProvider";
import { LoginModalContent } from "../components/auth/LoginModalContent";
import Navbar from "../components/Navbar";
import { PageLoader } from "../components/PageLoader";
import { ResponsiveHeroImage } from "../components/common/ResponsiveHeroImage";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { StickyHeader } from "../components/StickyHeader";
import { ExpertCard, ExpertCardSkeleton } from "../components/experts/ExpertCard";
import {
  ExpertsFilterPanel,
  type ExpertsPanelFilters,
} from "../components/experts/ExpertsFilterPanel";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useScrollPastRef } from "../hooks/useScrollPastRef";
import { useExperts } from "../hooks/useExperts";

const FIRST_FREE_EXPERT_KEY = "wildbook_guest_first_expert_detail";
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_CARD_COUNT = 8;

const EMPTY_PANEL_FILTERS: ExpertsPanelFilters = {
  primaryLocationId: null,
  languageIds: [],
  expertiseIds: [],
  minRating: null,
};

function areSetsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function ExploreExpertsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const isPastHero = useScrollPastRef(heroRef);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stickyFilterTop, setStickyFilterTop] = useState(0);
  const [roleFilter, setRoleFilter] = useState<"all" | "guide" | "naturalist">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [panelFilters, setPanelFilters] = useState<ExpertsPanelFilters>(EMPTY_PANEL_FILTERS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
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
      primaryLocationId: panelFilters.primaryLocationId,
      languageIds: panelFilters.languageIds,
      expertiseIds: panelFilters.expertiseIds,
      minRating: panelFilters.minRating,
    });

  const activeFilterCount =
    (panelFilters.primaryLocationId ? 1 : 0) +
    panelFilters.languageIds.length +
    panelFilters.expertiseIds.length;

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

  // Keep sticky filters flush under the fixed sticky navbar (no visual gap).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-sticky-header]");
    if (!header) return;

    const update = () => {
      // Prefer the glass navbar box — it matches the visible header height.
      const navbar = header.querySelector<HTMLElement>("#site-navbar-glass");
      const height = (navbar ?? header).getBoundingClientRect().height;
      setStickyFilterTop(Math.ceil(height));
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(header);
    window.addEventListener("resize", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

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
    `h-10 shrink-0 rounded-[4px] px-3.5 font-['Nunito'] font-medium text-[14px] transition-colors sm:h-12 sm:px-5 sm:text-[15px] lg:px-6 lg:text-[18px] ${
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
      <section
        ref={heroRef}
        className="relative min-h-[320px] h-[min(52svh,560px)] overflow-hidden bg-[#2f2b28] sm:min-h-[380px] sm:h-[min(56svh,640px)] md:min-h-[400px] md:h-[min(58svh,680px)] lg:min-h-[440px] lg:h-[min(60svh,720px)]"
      >
        <ResponsiveHeroImage
          mobileSrc={expertsMobile}
          tabletSrc={expertsTablet}
          desktopSrc={expertsDesktop}
          alt=""
        />

        <div className="relative z-10 flex h-full flex-col">
          <Navbar variant="light" />

          {/* Hero text — vertically centered within the banner */}
          <div className="flex flex-1 items-center page-px py-6 max-md:justify-center max-md:text-center sm:py-8 md:py-10 lg:py-12">
            <div className="max-w-[452px]">
              <h1
                className="font-['Montserrat'] font-medium leading-[1.1] text-[38px] text-[#EDE8E2]/90 sm:text-[52px] md:text-[62px] lg:text-[70px]"
                style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.25)" }}
              >
                Connect with Wildlife Experts
              </h1>
              <p
                style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
                className="mx-4 mt-2.5 font-['Nunito'] font-bold text-[14px] leading-[1.4] text-[#fafafa] sm:mx-0 sm:mt-4 sm:text-[16px] md:text-[18px] lg:text-[24px] lg:leading-[32px]">
                Explore and connect with our growing network of guides and naturalists, helping
                travelers access local knowledge across India’s wildlife destinations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── List section ── */}
      <section className="bg-[#F6F4F0] page-px pt-8 pb-10 sm:pt-10 md:pt-10 md:pb-11 lg:pt-8 lg:pb-12">

        {/* Title + count row */}
        <div className="mb-4 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <h2 className="font-['Nunito'] font-bold text-[18px] leading-snug text-[#2F2B28] sm:text-[20px] md:text-[24px] lg:text-[28px] lg:leading-[40px]">
            Explore Verified Forest Guides &amp; Naturalists
          </h2>
          <p className="shrink-0 font-['Nunito'] font-light text-[13px] text-[#73706C] md:text-[14px] lg:text-[16px] lg:leading-[32px]">
            {stats.totalCount > 0
              ? `Showing ${rangeStart}\u2013${rangeEnd} of ${stats.totalCount} experts`
              : "No experts found"}
          </p>
        </div>

        {/* Filter + search bar — sticky under the fixed navbar at all sizes */}
        <div
          style={{ top: stickyFilterTop }}
          className={[
            "sticky z-10 mb-6 flex flex-col gap-3 bg-[#F6F4F0] pt-2 pb-4",
            "-mx-[var(--page-px-mobile)] px-[var(--page-px-mobile)]",
            "shadow-[0_8px_16px_-10px_rgba(47,43,40,0.45)]",
            "md:mb-7 md:-mx-[var(--page-px-tablet)] md:px-[var(--page-px-tablet)] md:flex-row md:items-center md:justify-between md:gap-4 md:pt-3 md:pb-4",
            "lg:mb-8 lg:-mx-[var(--page-px-desktop)] lg:px-[var(--page-px-desktop)]",
          ].join(" ")}
        >
          {/* Role pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 lg:gap-4 [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={() => setRoleFilter("all")}
              className={pillClass(roleFilter === "all")}>All</button>
            <button type="button" onClick={() => setRoleFilter("guide")}
              className={pillClass(roleFilter === "guide")}>Guides</button>
            <button type="button" onClick={() => setRoleFilter("naturalist")}
              className={pillClass(roleFilter === "naturalist")}>Naturalists</button>
          </div>

          {/* Search + Filter */}
          <div className="flex min-w-0 w-full items-center gap-2 sm:gap-3 md:max-w-[520px] md:flex-1 md:justify-end lg:max-w-[720px]">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[4px] bg-[rgba(115,112,108,0.1)] pl-3 pr-3 sm:h-12 sm:gap-3 sm:pl-3.5 sm:pr-5">
              {isListRefreshing ? (
                <CircleNotchIcon
                  size={18}
                  className="shrink-0 animate-spin text-[#0B6E66] sm:size-5"
                  aria-hidden="true"
                />
              ) : (
                <MagnifyingGlassIcon size={18} className="shrink-0 text-[#73706C] sm:size-5" />
              )}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, location, or expertise"
                aria-busy={isListRefreshing}
                className="min-w-0 w-full bg-transparent font-['Nunito'] font-normal text-[13px] text-[#2F2B28] outline-none placeholder:text-[#73706C] sm:text-[14px] lg:text-[16px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(true)}
              aria-expanded={isFilterPanelOpen}
              aria-label={activeFilterCount > 0 ? `Filter (${activeFilterCount})` : "Filter"}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[4px] px-3 font-['Nunito'] font-normal text-[13px] whitespace-nowrap transition-colors sm:h-12 sm:gap-3 sm:px-5 sm:text-[14px] lg:px-6 lg:text-[16px] ${
                activeFilterCount > 0
                  ? "bg-[#0B6E66] text-[#FAFAFA]"
                  : "bg-[rgba(115,112,108,0.1)] text-[#2F2B28]"
              }`}
            >
              <FunnelSimpleIcon size={18} className="sm:size-5" />
              <span>
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </span>
            </button>
          </div>
        </div>

        {/* Error state */}
        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {/* Cards grid */}
        {isInitialLoading ? (
          <PageLoader />
        ) : isListRefreshing ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[1000px]:grid-cols-3 xl:grid-cols-4"
            aria-busy="true"
            aria-label="Loading experts"
          >
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <ExpertCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div
            className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[1000px]:grid-cols-3 xl:grid-cols-4"
            aria-busy={false}
          >
            {paged.map((expert) => {
              const expertPath = `/experts/${expert.slug || expert.id}`;
              return (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  isBookmarked={bookmarkedExpertIds.has(expert.id)}
                  isBookmarkPending={bookmarkingExpertIds.has(expert.id)}
                  onToggleBookmark={() => void toggleBookmark(expert.id)}
                  onShare={() => setSharePath(expertPath)}
                  onViewMore={() => handleViewDetails(expertPath)}
                />
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
                      style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
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
                    style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
                    onClick={() => { setShowExploreLoginGate(false); setPendingExpertPath(null); }}
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 rounded-md bg-[#0B6E66] px-4 py-2 text-[12px] leading-none"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
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

      <ExpertsFilterPanel
        open={isFilterPanelOpen}
        value={panelFilters}
        onClose={() => setIsFilterPanelOpen(false)}
        onApply={setPanelFilters}
      />
    </main>
  );
}
