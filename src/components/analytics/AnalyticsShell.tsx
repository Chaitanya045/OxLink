"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsTimeFilter } from "@/components/analytics/AnalyticsTimeFilter";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { AnalyticsLocationList } from "@/components/analytics/AnalyticsLocationList";
import { AnalyticsTrafficSources } from "@/components/analytics/AnalyticsTrafficSources";
import type { AnalyticsData, DateRange, TimePeriod, UrlClick, UrlInfo } from "@/types/analytics";
import { computeAnalyticsFromClicks } from "@/lib/analytics/computeAnalytics";
import { apiPath } from "@/lib/paths";

const POLL_INTERVAL_MS = 10_000;
const IDLE_STOP_MS = 60_000;

interface AnalyticsShellProps {
  shortCode: string;
  initialUrlInfo: UrlInfo | null;
  initialClicks: UrlClick[];
}

type LoadState = "initial" | "refreshing" | "ready";

export default function AnalyticsShell({
  shortCode,
  initialUrlInfo,
  initialClicks,
}: AnalyticsShellProps) {
  const router = useRouter();

  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);

  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(initialUrlInfo);
  const [clicks, setClicks] = useState<UrlClick[]>(initialClicks);

  const [loadState, setLoadState] = useState<LoadState>(
    initialUrlInfo ? "ready" : "initial"
  );
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const analyticsData: AnalyticsData | null = useMemo(() => {
    if (!urlInfo) return null;
    return computeAnalyticsFromClicks(clicks, timePeriod, customDateRange);
  }, [clicks, timePeriod, customDateRange, urlInfo]);

  const clicksChange =
    analyticsData && analyticsData.previousPeriodClicks > 0
      ? ((analyticsData.totalClicks - analyticsData.previousPeriodClicks) /
          analyticsData.previousPeriodClicks) *
        100
      : 0;

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;
    let idleTimerId: number | null = null;

    const qs = new URLSearchParams();
    qs.set("timePeriod", timePeriod);
    if (timePeriod === "custom" && customDateRange) {
      qs.set("start", new Date(customDateRange.start).toISOString());
      qs.set("end", new Date(customDateRange.end).toISOString());
    }

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(
          apiPath(`/api/urls/${shortCode}/analytics?${qs.toString()}`),
          {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to fetch analytics");
        }

        const payload = (await res.json().catch(() => null)) as
          | { urlClicksData?: UrlClick[] }
          | null;

        if (cancelled) return;

        setLoadState((prev) => (prev === "initial" ? "ready" : prev));
        setClicks(payload?.urlClicksData ?? []);
        setLastUpdated(new Date().toISOString());
        setError("");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to fetch analytics");
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

    setError("");
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
  }, [shortCode, timePeriod, customDateRange]);

  const refreshUrlInfo = async () => {
    try {
      setLoadState((prev) => (prev === "ready" ? "refreshing" : prev));
      const res = await fetch(apiPath(`/api/urls/${shortCode}/analytics`), {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to refresh URL info");
      }
      const data = await res.json();
      if (data?.urlInfo) {
        setUrlInfo(data.urlInfo as UrlInfo);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh URL info");
    } finally {
      setLoadState("ready");
      router.refresh();
    }
  };

  if (loadState === "initial") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="h-9 w-64 rounded bg-muted animate-pulse mb-2" />
            <div className="h-5 w-96 max-w-full rounded bg-muted animate-pulse" />
          </div>

          <div className="h-12 rounded bg-muted animate-pulse mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
            <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
            <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
            <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-[340px] rounded-lg bg-muted animate-pulse" />
            <div className="h-[340px] rounded-lg bg-muted animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px] rounded-lg bg-muted animate-pulse" />
            <div className="h-[320px] rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !urlInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData || !urlInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AnalyticsHeader urlInfo={urlInfo} onUrlUpdated={refreshUrlInfo} />

        <AnalyticsTimeFilter
          selectedPeriod={timePeriod}
          customDateRange={customDateRange}
          onPeriodChange={setTimePeriod}
          onCustomRangeChange={setCustomDateRange}
        />

        {error ? (
          <div className="mb-4 text-sm text-muted-foreground">{error}</div>
        ) : null}

        {lastUpdated ? (
          <div className="mb-6 text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        ) : null}

        <div className={loadState === "refreshing" ? "opacity-60" : ""}>
          <AnalyticsOverview
            totalClicks={analyticsData.totalClicks}
            uniqueVisitors={analyticsData.uniqueVisitors}
            topReferrer={analyticsData.topReferrer}
            topLocation={analyticsData.topLocation}
            clicksChange={clicksChange}
          />

          <AnalyticsCharts
            timeSeriesData={analyticsData.timeSeriesData}
            deviceData={analyticsData.deviceData}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsLocationList
              locationData={analyticsData.locationData}
              totalClicks={analyticsData.totalClicks}
            />
            <AnalyticsTrafficSources referrerData={analyticsData.referrerData} />
          </div>
        </div>
      </div>
    </div>
  );
}
