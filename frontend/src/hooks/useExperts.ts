import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchExperts, type ExpertListItem } from "../api/experts";

const PAGE_SIZE = 16;
type RoleFilter = "all" | "guide" | "naturalist";

type ExpertsBaseState = {
  pages: Record<number, ExpertListItem[]>;
  nextCursorByPage: Record<number, string | null>;
  totalCount: number | null;
  currentPage: number;
  isRefetching: boolean;
};

type UseExpertsState =
  | (ExpertsBaseState & {
      status: "idle" | "loading";
      error: null;
    })
  | (ExpertsBaseState & {
      status: "success";
      error: null;
    })
  | (ExpertsBaseState & {
      status: "error";
      error: string;
    });

function hasLoadedPages(pages: Record<number, ExpertListItem[]>): boolean {
  return Object.keys(pages).length > 0;
}

const INITIAL_STATE: UseExpertsState = {
  status: "idle",
  error: null,
  pages: {},
  nextCursorByPage: { 0: null },
  totalCount: null,
  currentPage: 1,
  isRefetching: false,
};

export function useExperts(filters: { role: RoleFilter; search: string; includeBookmark: boolean }) {
  const [state, setState] = useState<UseExpertsState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => {
      if (hasLoadedPages(prev.pages)) {
        return {
          ...prev,
          status: "loading",
          error: null,
          isRefetching: true,
          currentPage: 1,
        };
      }

      return {
        status: "loading",
        error: null,
        pages: {},
        nextCursorByPage: { 0: null },
        totalCount: null,
        currentPage: 1,
        isRefetching: false,
      };
    });

    fetchExperts(
      {
        limit: PAGE_SIZE,
        status: "published",
        role: filters.role,
        q: filters.search,
        includeBookmark: filters.includeBookmark,
      },
      controller.signal,
    )
      .then((page) =>
        setState({
          status: "success",
          error: null,
          pages: { 1: page.items },
          nextCursorByPage: { 0: null, 1: page.next_cursor },
          totalCount: page.total_count,
          currentPage: 1,
          isRefetching: false,
        }),
      )
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Failed to load experts.";
        setState((prev) => {
          if (hasLoadedPages(prev.pages)) {
            return {
              ...prev,
              status: "error",
              error: message,
              isRefetching: false,
            };
          }

          return {
            status: "error",
            error: message,
            pages: {},
            nextCursorByPage: { 0: null },
            totalCount: null,
            currentPage: 1,
            isRefetching: false,
          };
        });
      });

    return () => controller.abort();
  }, [filters.includeBookmark, filters.role, filters.search]);

  const goToPage = useCallback(
    async (targetPage: number) => {
      if (targetPage < 1) return;

      if (state.pages[targetPage]) {
        setState((prev) => ({ ...prev, currentPage: targetPage }));
        return;
      }

      setState((prev) => ({ ...prev, status: "loading", error: null, isRefetching: true }));
      try {
        const pages = { ...state.pages };
        const cursorByPage = { ...state.nextCursorByPage };
        let totalCount = state.totalCount;

        let startPage = 0;
        for (const p of Object.keys(pages).map(Number).sort((a, b) => a - b)) {
          if (p < targetPage) startPage = p;
        }

        let pageNum = Math.max(1, startPage + 1);
        while (pageNum <= targetPage) {
          if (!pages[pageNum]) {
            const cursor = cursorByPage[pageNum - 1] ?? null;
            if (pageNum > 1 && cursor === null) break;
            const page = await fetchExperts({
              limit: PAGE_SIZE,
              cursor: cursor ?? undefined,
              status: "published",
              role: filters.role,
              q: filters.search,
              includeBookmark: filters.includeBookmark,
            });
            pages[pageNum] = page.items;
            cursorByPage[pageNum] = page.next_cursor;
            totalCount = page.total_count ?? totalCount;
          }
          pageNum += 1;
        }

        setState((prev) => ({
          ...prev,
          status: "success",
          pages,
          nextCursorByPage: cursorByPage,
          totalCount,
          currentPage: pages[targetPage] ? targetPage : prev.currentPage,
          isRefetching: false,
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load experts.";
        setState((prev) => ({ ...prev, status: "error", error: message, isRefetching: false }));
      }
    },
    [filters.includeBookmark, filters.role, filters.search, state.nextCursorByPage, state.pages, state.totalCount],
  );

  const nextPage = useCallback(async () => {
    await goToPage(state.currentPage + 1);
  }, [goToPage, state.currentPage]);

  const prevPage = useCallback(() => {
    if (state.currentPage <= 1) return;
    setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
  }, [state.currentPage]);

  const stats = useMemo(
    () => ({
      totalShown: state.pages[state.currentPage]?.length ?? 0,
      totalCount: state.totalCount ?? 0,
      currentPage: state.currentPage,
      totalPages:
        state.totalCount && state.totalCount > 0
          ? Math.ceil(state.totalCount / PAGE_SIZE)
          : 1,
    }),
    [state.currentPage, state.pages, state.totalCount],
  );

  const isInitialLoading =
    (state.status === "idle" || state.status === "loading") && !hasLoadedPages(state.pages);

  return {
    ...state,
    data: state.pages[state.currentPage] ?? [],
    isInitialLoading,
    nextPage,
    prevPage,
    goToPage,
    stats,
    pageSize: PAGE_SIZE,
  };
}
