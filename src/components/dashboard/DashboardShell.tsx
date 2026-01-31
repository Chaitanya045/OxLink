"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PaginationData,
  SortBy,
  SortOrder,
  StatusFilter,
  Url,
} from "@/types/dashboard";

const POLL_INTERVAL_MS = 10_000;
const IDLE_STOP_MS = 60_000;

export type DashboardPollPayload = {
  urls: Url[];
  pagination: PaginationData;
  stats: { totalClicks: number; topPerforming: Url | null };
  lastUpdated: string;
};

// Backwards compat for older references
export type DashboardStreamPayload = DashboardPollPayload;

type DashboardLiveState = {
  connected: boolean;
  firstMessageReceived: boolean;
  lastUpdated: Date | null;
  urls: Url[];
  pagination: PaginationData;
  stats: { totalClicks: number; topPerforming: Url | null };
};

const DEFAULT_PAGINATION: PaginationData = {
  page: 1,
  limit: 10,
  totalCount: 0,
  totalPages: 0,
};

export function DashboardShell() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [prefilledAlias, setPrefilledAlias] = useState("");

  const [state, setState] = useState<DashboardLiveState>({
    connected: false,
    firstMessageReceived: false,
    lastUpdated: null,
    urls: [],
    pagination: DEFAULT_PAGINATION,
    stats: { totalClicks: 0, topPerforming: null },
  });

  const [isLoadingView, setIsLoadingView] = useState(false);
  const prevStreamUrlRef = useRef<string>("");

  const searchDebounceTimerRef = useRef<number | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(DEFAULT_PAGINATION.limit));

    const q = searchQuery.trim();
    if (q) params.set("search", q);
    if (statusFilter !== "all") params.set("status", statusFilter);

    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    return params.toString();
  }, [currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const isInitial = prevStreamUrlRef.current === "";
    const isViewChange = !isInitial && prevStreamUrlRef.current !== queryString;

    prevStreamUrlRef.current = queryString;

    if (isViewChange) {
      setIsLoadingView(true);
    }

    let cancelled = false;
    let intervalId: number | null = null;
    let idleTimerId: number | null = null;

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`/api/urls?${queryString}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch URLs");
        }

        const urlsPayload = await res.json();

        const statsRes = await fetch("/api/urls/stats", {
          credentials: "include",
          cache: "no-store",
        });

        const statsPayload = statsRes.ok ? await statsRes.json() : null;

        if (cancelled) return;

        setState((s) => ({
          ...s,
          connected: true,
          firstMessageReceived: true,
          lastUpdated: new Date(),
          urls: urlsPayload.data ?? [],
          pagination: urlsPayload.pagination ?? DEFAULT_PAGINATION,
          stats: {
            totalClicks: statsPayload?.totalClicks ?? 0,
            topPerforming: statsPayload?.topPerforming ?? null,
          },
        }));
        setIsLoadingView(false);
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: false }));
      }
    };

    const start = () => {
      if (document.visibilityState !== "visible") return;
      void fetchSnapshot();
      if (intervalId) window.clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") return;
        void fetchSnapshot();
      }, POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = null;
      if (idleTimerId) window.clearTimeout(idleTimerId);
      idleTimerId = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
        if (idleTimerId) window.clearTimeout(idleTimerId);
        idleTimerId = window.setTimeout(stop, IDLE_STOP_MS);
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();

    const onActivity = () => {
      if (document.visibilityState !== "visible") return;
      start();
      if (idleTimerId) window.clearTimeout(idleTimerId);
      idleTimerId = window.setTimeout(stop, IDLE_STOP_MS);
    };

    window.addEventListener("focus", onActivity);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      cancelled = true;
      stop();
      window.removeEventListener("focus", onActivity);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, [queryString]);

  const handleCreateWithAlias = (alias: string) => {
    setPrefilledAlias(alias);
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    setPrefilledAlias("");
    // Polling continues automatically; we can add a manual refresh later if needed.
  };

  const pageCount = state.pagination.totalPages || 0;
  const pageNumbers = getPageNumbers(currentPage, pageCount);

  const [cmp, setCmp] = useState<{
    DashboardHeader: typeof import("@/components/dashboard/DashboardHeader").DashboardHeader;
    DashboardStats: typeof import("@/components/dashboard/DashboardStats").DashboardStats;
    DashboardSearch: typeof import("@/components/dashboard/DashboardSearch").DashboardSearch;
    DashboardUrlList: typeof import("@/components/dashboard/DashboardUrlList").DashboardUrlList;
    Pagination: typeof import("@/components/dashboard/Pagination").Pagination;
    CreateUrlModal: typeof import("@/components/dashboard/CreateUrlModal").CreateUrlModal;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("@/components/dashboard/DashboardHeader"),
      import("@/components/dashboard/DashboardStats"),
      import("@/components/dashboard/DashboardSearch"),
      import("@/components/dashboard/DashboardUrlList"),
      import("@/components/dashboard/Pagination"),
      import("@/components/dashboard/CreateUrlModal"),
    ]).then(
      ([
        header,
        stats,
        search,
        list,
        pagination,
        createModal,
      ]) => {
        if (cancelled) return;
        setCmp({
          DashboardHeader: header.DashboardHeader,
          DashboardStats: stats.DashboardStats,
          DashboardSearch: search.DashboardSearch,
          DashboardUrlList: list.DashboardUrlList,
          Pagination: pagination.Pagination,
          CreateUrlModal: createModal.CreateUrlModal,
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const showSkeletons = !state.firstMessageReceived;
  const showListSkeletons = showSkeletons || isLoadingView;

  const setSearchQueryDebounced = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);

    if (searchDebounceTimerRef.current) {
      window.clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = window.setTimeout(() => {
      // no-op; changing searchQuery already triggers streamUrl change
    }, 250);
  };

  return (
    <div className="h-[calc(100dvh-64px)] bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 pt-8 pb-0 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0">
          {cmp ? (
            <cmp.DashboardHeader lastUpdated={state.lastUpdated} />
          ) : (
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-9 w-40 rounded bg-muted animate-pulse mb-2" />
                <div className="h-5 w-80 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-44 rounded bg-muted animate-pulse hidden sm:block" />
            </div>
          )}

          {showSkeletons || !cmp ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
              <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
              <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
            </div>
          ) : (
            <cmp.DashboardStats
              totalCount={state.pagination.totalCount}
              totalClicks={state.stats.totalClicks}
              topPerforming={state.stats.topPerforming}
            />
          )}

        {cmp ? (
          <cmp.DashboardSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQueryDebounced}
            isSearching={showSkeletons || !state.connected}
            statusFilter={statusFilter}
            onStatusChange={(s) => {
              setStatusFilter(s);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={(v) => {
              setSortBy(v);
              setCurrentPage(1);
            }}
            sortOrder={sortOrder}
            onSortOrderChange={(v) => {
              setSortOrder(v);
              setCurrentPage(1);
            }}
          />
        ) : (
          <div className="h-10 rounded bg-muted animate-pulse mb-6" />
        )}

        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto pr-1 overscroll-contain">
            {showListSkeletons || !cmp ? (
              <div className="space-y-3">
                <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
                <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
                <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
              </div>
            ) : (
              <cmp.DashboardUrlList
                urls={state.urls}
                fetchingUrls={false}
                searchQuery={searchQuery}
                onCreateWithAlias={handleCreateWithAlias}
                  onUrlUpdated={() => {
                    // no-op for now (polling will pick up updates)
                  }}
              />
            )}
          </div>
        </div>

          {cmp && (
            <cmp.CreateUrlModal
              prefilledAlias={prefilledAlias}
              open={createModalOpen}
              onOpenChange={setCreateModalOpen}
              onSuccess={handleCreateSuccess}
            />
          )}
        </div>
      </div>


      {!showSkeletons && cmp && (
        <div className="sticky bottom-0 z-30 border-t border-border/70 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="container mx-auto px-4 py-4">
            <cmp.Pagination
              currentPage={currentPage}
              totalPages={pageCount}
              pageNumbers={pageNumbers}
              onPageChange={setCurrentPage}
              onNextPage={() => setCurrentPage((p) => Math.min(pageCount || 1, p + 1))}
              onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (!totalPages || totalPages <= 1) return [1];

  const maxButtons = 5;
  const pages: number[] = [];

  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}
