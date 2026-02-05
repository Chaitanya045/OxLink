import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { PaginationData, Url } from "@/types/dashboard";

const POLL_INTERVAL_MS = 10_000;
const IDLE_STOP_MS = 60_000;

export type DashboardPollPayload = {
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

function useSmartPolling(refetch: () => void, enabled: boolean) {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!enabled) return;

    let intervalId: number | null = null;
    let idleTimerId: number | null = null;

    const start = () => {
      if (document.visibilityState !== "visible") return;
      refetchRef.current();
      if (intervalId) window.clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") return;
        refetchRef.current();
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

    const onActivity = () => {
      if (document.visibilityState !== "visible") return;
      start();
      if (idleTimerId) window.clearTimeout(idleTimerId);
      idleTimerId = window.setTimeout(stop, IDLE_STOP_MS);
    };

    if (document.visibilityState === "visible") start();

    window.addEventListener("focus", onActivity);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      stop();
      window.removeEventListener("focus", onActivity);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, [enabled]);
}

export function useDashboardData(args: {
  queryString: string;
  enabled?: boolean;
}) {
  const enabled = args.enabled ?? true;

  const urlsQuery = useQuery({
    queryKey: queryKeys.urls.list(args.queryString),
    queryFn: async () => {
      return apiJson<{ data: Url[]; pagination: PaginationData }>(
        apiPath(`/api/urls?${args.queryString}`),
        {
          credentials: "include",
          cache: "no-store",
        }
      );
    },
    enabled,
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.urls.stats,
    queryFn: async () => {
      return apiJson<{ totalClicks: number; topPerforming: Url | null }>(
        apiPath("/api/urls/stats"),
        {
          credentials: "include",
          cache: "no-store",
        }
      );
    },
    enabled,
  });

  const refetchBoth = () => {
    void urlsQuery.refetch();
    void statsQuery.refetch();
  };

  useSmartPolling(refetchBoth, enabled);

  const isConnected = enabled && !urlsQuery.isError && !statsQuery.isError;
  const hasAnyData = Boolean(urlsQuery.data || statsQuery.data);

  const lastUpdated = useMemo(() => {
    if (!enabled) return null;
    if (!hasAnyData) return null;
    const ts = Math.max(urlsQuery.dataUpdatedAt, statsQuery.dataUpdatedAt);
    return ts ? new Date(ts) : new Date();
  }, [enabled, hasAnyData, urlsQuery.dataUpdatedAt, statsQuery.dataUpdatedAt]);

  const state: DashboardLiveState = useMemo(
    () => ({
      connected: isConnected,
      firstMessageReceived: hasAnyData,
      lastUpdated,
      urls: urlsQuery.data?.data ?? [],
      pagination: urlsQuery.data?.pagination ?? DEFAULT_PAGINATION,
      stats: {
        totalClicks: statsQuery.data?.totalClicks ?? 0,
        topPerforming: statsQuery.data?.topPerforming ?? null,
      },
    }),
    [
      hasAnyData,
      isConnected,
      lastUpdated,
      statsQuery.data?.topPerforming,
      statsQuery.data?.totalClicks,
      urlsQuery.data?.data,
      urlsQuery.data?.pagination,
    ]
  );

  const isInitialLoading = enabled && !hasAnyData;

  return {
    state,
    isInitialLoading,
    hasUrlsData: Boolean(urlsQuery.data),
    isFetchingUrls: urlsQuery.isFetching,
    isFetchingStats: statsQuery.isFetching,
    refetch: async () => {
      await Promise.all([urlsQuery.refetch(), statsQuery.refetch()]);
    },
  };
}
