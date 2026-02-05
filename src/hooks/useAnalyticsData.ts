import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { DateRange, TimePeriod, UrlClick, UrlInfo } from "@/types/analytics";

const POLL_INTERVAL_MS = 10_000;
const IDLE_STOP_MS = 60_000;

function useSmartPolling(refetch: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let intervalId: number | null = null;
    let idleTimerId: number | null = null;

    const start = () => {
      if (document.visibilityState !== "visible") return;
      refetch();
      if (intervalId) window.clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible") return;
        refetch();
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
  }, [refetch, enabled]);
}

type AnalyticsPayload = {
  urlClicksData: UrlClick[];
  urlInfo: UrlInfo;
};

export function useAnalyticsData(args: {
  shortCode: string;
  timePeriod: TimePeriod;
  customDateRange: DateRange | null;
  enabled?: boolean;
}) {
  const enabled = args.enabled ?? true;

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("timePeriod", args.timePeriod);
    if (args.timePeriod === "custom" && args.customDateRange) {
      qs.set("start", new Date(args.customDateRange.start).toISOString());
      qs.set("end", new Date(args.customDateRange.end).toISOString());
    }
    return qs.toString();
  }, [args.timePeriod, args.customDateRange]);

  const query = useQuery({
    queryKey: queryKeys.analytics.snapshot(args.shortCode, queryString),
    queryFn: async () => {
      return apiJson<AnalyticsPayload>(
        apiPath(`/api/urls/${args.shortCode}/analytics?${queryString}`),
        {
          credentials: "include",
          cache: "no-store",
        }
      );
    },
    enabled,
  });

  useSmartPolling(() => {
    void query.refetch();
  }, enabled);

  const lastUpdated = useMemo(() => {
    if (!enabled) return null;
    if (!query.data) return null;
    return new Date(query.dataUpdatedAt).toISOString();
  }, [enabled, query.data, query.dataUpdatedAt]);

  return {
    data: query.data,
    error: query.error instanceof Error ? query.error.message : "",
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    lastUpdated,
    refetch: async () => {
      await query.refetch();
    },
  };
}
