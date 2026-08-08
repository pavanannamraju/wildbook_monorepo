import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRightIcon,
  CircleNotchIcon,
  MagnifyingGlassIcon,
  SignInIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "@phosphor-icons/react";

import bannerImg from "../assets/Explore_Experts_V4.png";
import { addBookmark, removeBookmark } from "../api/bookmarks";
import {
  fetchExpertFilterOptions,
  type ExpertFilterOptions,
} from "../api/experts";
import { useAuth } from "../auth/AuthProvider";
import { LoginModalContent } from "../components/auth/LoginModalContent";
import { PageLoader } from "../components/PageLoader";
import { ShareLinkModal } from "../components/common/ShareLinkModal";
import { ExpertCard, ExpertCardSkeleton } from "../components/experts/ExpertCard";
import { FilterTag } from "../components/experts/FilterTag";
import {
  ExpertsFilterPanel,
  type ExpertsPanelFilters,
} from "../components/experts/ExpertsFilterPanel";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useExperts } from "../hooks/useExperts";
import { track } from "../lib/analytics";

const FIRST_FREE_EXPERT_KEY = "wildbook_guest_first_expert_detail";
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_CARD_COUNT = 8;

const EMPTY_PANEL_FILTERS: ExpertsPanelFilters = {
  primaryLocationId: null,
  languageIds: [],
  expertiseIds: [],
  minRating: null,
};

const QUICK_FILTERS = [
  { label: "All", value: "all" as const },
  { label: "Naturalists", value: "naturalist" as const },
  { label: "Guides", value: "guide" as const },
];

function areSetsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function ExploreExpertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [filterOptions, setFilterOptions] = useState<ExpertFilterOptions>({
    locations: [],
    languages: [],
    expertise: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchExpertFilterOptions(controller.signal)
      .then(setFilterOptions)
      .catch(() => {
        /* pills fall back to ids if options fail */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) return;
    track("experts_search", { search_len: q.length });
  }, [debouncedSearch]);

  const { status, data, error, isInitialLoading, isRefetching, nextPage, prevPage, goToPage, stats } =
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

  const nameById = (options: { id: string; name: string }[], id: string) =>
    options.find((option) => option.id === id)?.name ?? id;

  const activeFilterTags = [
    ...(panelFilters.primaryLocationId
      ? [
          {
            key: `loc-${panelFilters.primaryLocationId}`,
            label: nameById(filterOptions.locations, panelFilters.primaryLocationId),
            onRemove: () =>
              setPanelFilters((prev) => ({ ...prev, primaryLocationId: null })),
          },
        ]
      : []),
    ...panelFilters.expertiseIds.map((id) => ({
      key: `exp-${id}`,
      label: nameById(filterOptions.expertise, id),
      onRemove: () =>
        setPanelFilters((prev) => ({
          ...prev,
          expertiseIds: prev.expertiseIds.filter((value) => value !== id),
        })),
    })),
    ...panelFilters.languageIds.map((id) => ({
      key: `lang-${id}`,
      label: nameById(filterOptions.languages, id),
      onRemove: () =>
        setPanelFilters((prev) => ({
          ...prev,
          languageIds: prev.languageIds.filter((value) => value !== id),
        })),
    })),
  ];

  const totalPages = stats.totalPages;
  const currentPage = stats.currentPage;
  const paged = data;
  const isSearchPending = search !== debouncedSearch;
  const isListRefreshing = isSearchPending || isRefetching;

  const handleViewDetails = (expertPath: string) => {
    const expertId = expertPath.replace("/experts/", "");
    track("expert_card_click", { expert_id: expertId });

    if (user) {
      navigate(expertPath);
      return;
    }

    const nextExpertId = expertId;
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

  useEffect(() => {
    if (!isFilterPanelOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFilterPanelOpen]);

  const toggleBookmark = async (expertId: string) => {
    if (!user) {
      track("auth_modal_open", { source: "bookmark" });
      setShowLoginModal(true);
      return;
    }
    if (bookmarkingExpertIds.has(expertId)) return;
    const isBookmarked = bookmarkedExpertIds.has(expertId);

    setBookmarkingExpertIds((prev) => new Set(prev).add(expertId));
    setBookmarkedExpertIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(expertId);
      else next.add(expertId);
      return next;
    });

    try {
      if (isBookmarked) await removeBookmark("expert", expertId);
      else await addBookmark("expert", expertId);
      track("expert_bookmark_toggle", {
        expert_id: expertId,
        is_bookmarked: !isBookmarked,
      });
    } catch {
      setBookmarkedExpertIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(expertId);
        else next.delete(expertId);
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

  const pageButtonClass = (active: boolean) =>
    `flex size-[32px] items-center justify-center rounded-[4px] font-bold text-[14px] ${
      active
        ? "border border-[#0b6e66] bg-[#fbf9f6] text-[#0b6e66]"
        : "border border-[#dfe3e8] bg-[#f3eee9] text-[#73706c]"
    }`;

  const clearPanelFilters = () => {
    setPanelFilters(EMPTY_PANEL_FILTERS);
    track("experts_filter_clear", { scope: "all" });
  };

  const handleApplyPanelFilters = (next: ExpertsPanelFilters) => {
    setPanelFilters(next);
    const empty =
      !next.primaryLocationId && next.languageIds.length === 0 && next.expertiseIds.length === 0;
    if (empty) {
      track("experts_filter_clear", { scope: "panel" });
      return;
    }
    track("experts_filter_apply", {
      has_location: Boolean(next.primaryLocationId),
      language_count: next.languageIds.length,
      expertise_count: next.expertiseIds.length,
    });
  };

  const handlePageChange = (page: number) => {
    track("experts_page_change", { page });
    void goToPage(page);
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F6F4F1" }}>
      {/* Banner */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(320px, 45vw, 520px)" }}>
        <img
          src={bannerImg}
          alt="Safari jeep on a forest trail"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 55%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(5,25,18,0.78) 0%, rgba(5,25,18,0.42) 55%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8 md:px-14 md:pb-10 lg:px-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 max-w-xl font-['Montserrat'] text-3xl leading-tight font-bold md:text-4xl lg:text-5xl"
          >
            <span className="text-white">Connect with</span>
            <br />
            <span style={{ color: "#F0C165" }}>Wildlife Experts</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="max-w-lg font-['Nunito'] text-sm leading-relaxed md:text-base"
            style={{ color: "rgba(255,255,255,0.78)" }}
          >
            Explore and connect with our growing network of guides and naturalists, helping travelers
            access local knowledge across India&apos;s wildlife destinations.
          </motion.p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div
        className="sticky top-16 z-40"
        style={{
          backgroundColor: "#F6F4F1",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div className="container mx-auto flex flex-col gap-3 px-6 py-3 md:flex-row md:items-center lg:px-12">
          <div className="flex shrink-0 items-center gap-1.5">
            {QUICK_FILTERS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => {
                  setRoleFilter(tag.value);
                  track("experts_role_filter", { role: tag.value });
                }}
                className="shrink-0 whitespace-nowrap px-3.5 py-1.5 font-['Nunito'] text-xs font-semibold transition-all duration-200"
                style={{
                  borderRadius: "4px",
                  ...(roleFilter === tag.value
                    ? { backgroundColor: "#0B6E66", color: "#ffffff" }
                    : {
                        backgroundColor: "white",
                        color: "#3B372F",
                        border: "1px solid rgba(59,55,47,0.18)",
                      }),
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div className="hidden h-5 w-px shrink-0 md:block" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />

          <div className="relative min-w-0 flex-1">
            {isListRefreshing ? (
              <CircleNotchIcon
                size={14}
                weight="bold"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 animate-spin"
                style={{ color: "#0B6E66" }}
              />
            ) : (
              <MagnifyingGlassIcon
                size={14}
                weight="bold"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                style={{ color: "#0B6E66" }}
              />
            )}
            <input
              type="text"
              placeholder="Search by name, park or speciality…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-busy={isListRefreshing}
              className="h-9 w-full py-0 pr-4 pl-9 font-['Nunito'] text-sm focus:ring-2 focus:ring-[#0B6E66]/25 focus:outline-none"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "4px",
                color: "#3B372F",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFilterPanelOpen(true);
              track("experts_filter_open");
            }}
            className="inline-flex h-9 shrink-0 items-center gap-2 px-4 font-['Nunito'] text-sm font-semibold transition-colors duration-200"
            style={{
              borderRadius: "4px",
              backgroundColor: activeFilterCount > 0 ? "#0B6E66" : "white",
              color: activeFilterCount > 0 ? "white" : "#3B372F",
              border: activeFilterCount > 0 ? "none" : "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <SlidersHorizontalIcon size={14} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0B6E66]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 pt-5 lg:px-12">
        <div className="mb-6 flex min-h-[28px] flex-wrap items-center gap-2">
          {activeFilterTags.map((tag) => (
            <FilterTag key={tag.key} label={tag.label} onRemove={tag.onRemove} />
          ))}
          {activeFilterCount > 0 ? <span className="flex-1" /> : null}
          <p className="whitespace-nowrap font-['Nunito'] text-sm" style={{ color: "#73706C" }}>
            Showing{" "}
            <span className="font-semibold" style={{ color: "#3B372F" }}>
              {stats.totalCount}
            </span>{" "}
            experts
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearPanelFilters}
                className="ml-3 font-semibold text-[#0B6E66] hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </p>
        </div>

        {status === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : null}

        {isInitialLoading ? (
          <PageLoader />
        ) : isListRefreshing ? (
          <div className="experts-list-grid" aria-busy="true" aria-label="Loading experts">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <ExpertCardSkeleton key={index} />
            ))}
          </div>
        ) : paged.length > 0 ? (
          <>
            <div className="experts-list-grid">
              {paged.map((expert, i) => {
                const expertPath = `/experts/${expert.slug || expert.id}`;
                return (
                  <ExpertCard
                    key={expert.id}
                    expert={expert}
                    index={i}
                    isBookmarked={bookmarkedExpertIds.has(expert.id)}
                    isBookmarkPending={bookmarkingExpertIds.has(expert.id)}
                    onToggleBookmark={() => void toggleBookmark(expert.id)}
                    onShare={() => {
                      setSharePath(expertPath);
                      track("expert_share_open", { expert_id: expert.id });
                    }}
                    onViewMore={() => handleViewDetails(expertPath)}
                  />
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    track("experts_page_change", { page: currentPage - 1, direction: "prev" });
                    void prevPage();
                  }}
                  className="flex size-8 items-center justify-center rounded-[4px] bg-[rgba(59,55,47,0.4)] text-white transition-opacity hover:bg-[rgba(59,55,47,0.55)] disabled:opacity-50"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(8, totalPages) }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handlePageChange(value)}
                      className={pageButtonClass(currentPage === value)}
                    >
                      {value}
                    </button>
                  );
                })}
                {totalPages > 8 ? (
                  <>
                    <span className="flex size-8 items-center justify-center rounded-[4px] border border-[#dfe3e8] bg-[#f3eee9] text-[14px] font-bold text-[#73706c]">
                      …
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      className={pageButtonClass(currentPage === totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    track("experts_page_change", { page: currentPage + 1, direction: "next" });
                    void nextPage();
                  }}
                  className="flex size-8 items-center justify-center rounded-[4px] bg-[rgba(59,55,47,0.4)] text-white transition-opacity hover:bg-[rgba(59,55,47,0.55)] disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
            <p className="mb-2 font-['Montserrat'] text-base font-bold" style={{ color: "#3B372F" }}>
              No experts found
            </p>
            <p className="font-['Nunito'] text-sm" style={{ color: "#73706C" }}>
              Try adjusting your search or clearing the filters.
            </p>
          </motion.div>
        )}
      </div>

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
                    <p className="mt-5 text-[20px] leading-[1.55] text-white/90 md:text-[22px]">
                      Log in or create an account to explore detailed profiles, experience offerings, and
                      availability of wildlife guides and naturalists.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
                    onClick={() => {
                      setShowExploreLoginGate(false);
                      setPendingExpertPath(null);
                    }}
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
                    onClick={() => {
                      setShowExploreLoginGate(false);
                      setPendingExpertPath(null);
                    }}
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 rounded-md bg-[#0B6E66] px-4 py-2 text-[12px] leading-none"
                    style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300 }}
                    onClick={() => {
                      track("auth_modal_open", { source: "explore_gate" });
                      setShowExploreLoginGate(false);
                      setShowLoginModal(true);
                    }}
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

      {createPortal(
        <AnimatePresence>
          {showLoginModal ? (
            <>
              <motion.div
                key="login-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-1200 bg-black/80"
                onClick={() => setShowLoginModal(false)}
              />
              <motion.div
                key="login-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none fixed inset-0 z-1201 flex items-center justify-center p-4"
              >
                <div className="pointer-events-auto w-full max-w-[1120px]">
                  <LoginModalContent
                    analyticsSource="explore"
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
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}

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
        onApply={handleApplyPanelFilters}
      />
    </div>
  );
}
