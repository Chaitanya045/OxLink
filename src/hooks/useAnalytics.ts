import { useState, useEffect, useCallback } from "react";
import type {
  UrlClick,
  AnalyticsData,
  UrlInfo,
  DeviceData,
  LocationData,
  ReferrerData,
  TimeSeriesData,
  TopReferrer,
  TopLocation,
} from "@/types/analytics";

interface UseAnalyticsOptions {
  shortCode: string;
}

interface UseAnalyticsReturn {
  loading: boolean;
  error: string;
  analyticsData: AnalyticsData | null;
  urlInfo: UrlInfo | null;
  clicksChange: number;
  fetchAnalytics: () => Promise<void>;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export function useAnalytics({ shortCode }: UseAnalyticsOptions): UseAnalyticsReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);

  const processClicksData = useCallback((clicks: UrlClick[]): AnalyticsData => {
    const total = clicks.length;
    const now = new Date();

    // Calculate period-over-period comparison
    const last7Days = clicks.filter((c) => {
      const clickDate = new Date(c.clickedAt);
      const daysAgo = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    const previous7Days = clicks.filter((c) => {
      const clickDate = new Date(c.clickedAt);
      const daysAgo = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 7 && daysAgo <= 14;
    });

    const totalClicks = last7Days.length;
    const previousPeriodClicks = previous7Days.length;

    // Unique visitors
    const uniqueIps = new Set(clicks.map((c) => c.ipAddress).filter(Boolean)).size;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    clicks.forEach((click) => {
      const device = click.deviceType || "Unknown";
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    const deviceData: DeviceData[] = Object.entries(deviceBreakdown).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: Math.round((value / total) * 100),
      })
    );

    // Location breakdown
    const locationBreakdown: Record<string, number> = {};
    clicks.forEach((click) => {
      const country = click.country || "Unknown";
      locationBreakdown[country] = (locationBreakdown[country] || 0) + 1;
    });

    const locationData: LocationData[] = Object.entries(locationBreakdown)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topLocation: TopLocation = locationData.length > 0
      ? {
          name: locationData[0].country,
          percentage: Math.round((locationData[0].count / total) * 100),
        }
      : { name: "", percentage: 0 };

    // Referrer breakdown
    const referrerBreakdown: Record<string, number> = {};
    clicks.forEach((click) => {
      let source = "Direct / Email";
      if (click.referrer) {
        try {
          const url = new URL(click.referrer);
          source = url.hostname.replace("www.", "");
          if (source.includes("twitter") || source.includes("t.co")) {
            source = "Twitter / X";
          } else if (source.includes("linkedin")) {
            source = "LinkedIn";
          } else if (source.includes("facebook")) {
            source = "Facebook";
          }
        } catch {
          source = "Others";
        }
      }
      referrerBreakdown[source] = (referrerBreakdown[source] || 0) + 1;
    });

    const referrerData: ReferrerData[] = Object.entries(referrerBreakdown)
      .map(([source, count]) => ({ source, count, change: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topReferrer: TopReferrer = referrerData.length > 0
      ? {
          name: referrerData[0].source,
          percentage: Math.round((referrerData[0].count / total) * 100),
        }
      : { name: "", percentage: 0 };

    // Time series data (last 7 days)
    const last7DaysData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      last7DaysData[dateStr] = 0;
    }

    clicks.forEach((click) => {
      const clickDate = new Date(click.clickedAt);
      const daysAgo = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 7) {
        const dateStr = clickDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (last7DaysData[dateStr] !== undefined) {
          last7DaysData[dateStr]++;
        }
      }
    });

    const timeSeriesData: TimeSeriesData[] = Object.entries(last7DaysData).map(
      ([date, clicks]) => ({
        date,
        clicks,
      })
    );

    return {
      clicks,
      totalClicks,
      uniqueVisitors: uniqueIps,
      previousPeriodClicks,
      deviceData,
      locationData,
      referrerData,
      timeSeriesData,
      topReferrer,
      topLocation,
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/urls/${shortCode}/analytics`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      const clicks: UrlClick[] = data.urlClicksData;
      const processedData = processClicksData(clicks);
      setAnalyticsData(processedData);

      // Get URL info
      const urlResponse = await fetch(`/api/urls?page=1&limit=100`, {
        credentials: "include",
      });
      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        const url = urlData.data.find(
          (u: any) => u.shortCode === shortCode || u.customAlias === shortCode
        );
        if (url) {
          setUrlInfo({
            originalUrl: url.originalUrl,
            shortUrl: url.shortUrl,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [shortCode, processClicksData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const clicksChange =
    analyticsData && analyticsData.previousPeriodClicks > 0
      ? ((analyticsData.totalClicks - analyticsData.previousPeriodClicks) /
          analyticsData.previousPeriodClicks) *
        100
      : 0;

  return {
    loading,
    error,
    analyticsData,
    urlInfo,
    clicksChange,
    fetchAnalytics,
  };
}

export { CHART_COLORS };
