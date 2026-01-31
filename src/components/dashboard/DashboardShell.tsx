"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PaginationData,
  SortBy,
  SortOrder,
  StatusFilter,
  Url,
} from "@/types/dashboard";

export type DashboardStreamPayload = {
  urls: Url[];
  pagination: PaginationData;
  stats: { totalClicks: number; topPerforming: Url | null };
  lastUpdated: string;
};

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

  const searchDebounceTimerRef = useRef<number | null>(null);

  const streamUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(DEFAULT_PAGINATION.limit));

    const q = searchQuery.trim();
    if (q) params.set("search", q);
    if (statusFilter !== "all") params.set("status", statusFilter);

    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    return `/api/dashboard/stream?${params.toString()}`;
  }, [currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const es = new EventSource(streamUrl);

    setState((s) => ({ ...s, connected: false }));

    es.onopen = () => {
      setState((s) => ({ ...s, connected: true }));
    };

    const handlePayload = (payload: DashboardStreamPayload) => {
      setState((s) => ({
        ...s,
        firstMessageReceived: true,
        lastUpdated: payload.lastUpdated ? new Date(payload.lastUpdated) : new Date(),
        urls: payload.urls,
        pagination: payload.pagination,
        stats: payload.stats,
      }));
    };

    es.addEventListener("snapshot", (ev) => {
      try {
        const payload: DashboardStreamPayload = JSON.parse((ev as MessageEvent).data);
        handlePayload(payload);
      } catch {
        // ignore malformed messages
      }
    });

    es.onmessage = (event) => {
      try {
        const payload: DashboardStreamPayload = JSON.parse(event.data);
        handlePayload(payload);
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      setState((s) => ({ ...s, connected: false }));
    };

    return () => {
      es.close();
    };
  }, [streamUrl]);

  const handleCreateWithAlias = (alias: string) => {
    setPrefilledAlias(alias);
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    setPrefilledAlias("");
    // SSE reconnect happens automatically on next mount; user can also tweak any filter
    // We can add a manual refresh later if needed.
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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

        {showSkeletons || !cmp ? (
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
              // leave as-is for now; SSE reconnect on query changes
            }}
          />
        )}

        {!showSkeletons && cmp && (
          <cmp.Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            pageNumbers={pageNumbers}
            onPageChange={setCurrentPage}
            onNextPage={() => setCurrentPage((p) => Math.min(pageCount || 1, p + 1))}
            onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          />
        )}

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
