import { useState, useEffect, useCallback, useRef } from "react";
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
  TimePeriod,
  DateRange,
} from "@/types/analytics";

interface UseAnalyticsOptions {
  shortCode: string;
  timePeriod?: TimePeriod;
  customDateRange?: DateRange | null;
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

export function useAnalytics({ shortCode, timePeriod = "7d", customDateRange = null }: UseAnalyticsOptions): UseAnalyticsReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);
  // Store raw clicks to reprocess without refetching
  const rawClicksRef = useRef<UrlClick[]>([]);
  const initialFetchDoneRef = useRef(false);

  const processClicksData = useCallback((clicks: UrlClick[], period: TimePeriod, dateRange: DateRange | null): AnalyticsData => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let periodDays: number;

    // Determine the date range based on period
    if (period === "custom" && dateRange) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      // Set start date to start of day
      startDate.setHours(0, 0, 0, 0);
      periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (period === "7d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      periodDays = 7;
    } else if (period === "30d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      periodDays = 30;
    } else {
      // All time - use earliest click or a very old date
      const earliestClick = clicks.length > 0 
        ? new Date(Math.min(...clicks.map(c => new Date(c.clickedAt).getTime())))
        : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year ago
      startDate = new Date(earliestClick);
      startDate.setHours(0, 0, 0, 0);
      periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Filter clicks within the selected period
    const periodClicks = clicks.filter((c) => {
      const clickDate = new Date(c.clickedAt);
      return clickDate >= startDate && clickDate <= endDate;
    });

    // Calculate previous period for comparison (only for 7d and 30d)
    let previousPeriodClicks = 0;
    if (period === "7d" || period === "30d") {
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - periodDays);
      const previousEndDate = new Date(startDate);
      previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);

      previousPeriodClicks = clicks.filter((c) => {
        const clickDate = new Date(c.clickedAt);
        return clickDate >= previousStartDate && clickDate <= previousEndDate;
      }).length;
    }

    const totalClicks = periodClicks.length;
    const total = periodClicks.length;

    // Unique visitors (from period clicks)
    const uniqueIps = new Set(periodClicks.map((c) => c.ipAddress).filter(Boolean)).size;

    // Device breakdown (from period clicks)
    const deviceBreakdown: Record<string, number> = {};
    periodClicks.forEach((click) => {
      const device = click.deviceType || "Unknown";
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    const deviceData: DeviceData[] = Object.entries(deviceBreakdown).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      })
    );

    // Location breakdown (from period clicks)
    const locationBreakdown: Record<string, number> = {};
    periodClicks.forEach((click) => {
      const country = click.country || "Unknown";
      locationBreakdown[country] = (locationBreakdown[country] || 0) + 1;
    });

    const locationData: LocationData[] = Object.entries(locationBreakdown)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const topLocation: TopLocation = locationData.length > 0 && totalClicks > 0
      ? {
          name: locationData[0].country,
          percentage: Math.round((locationData[0].count / totalClicks) * 100),
        }
      : { name: "", percentage: 0 };

    // Referrer breakdown (from period clicks)
    const referrerBreakdown: Record<string, number> = {};
    periodClicks.forEach((click) => {
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
      .sort((a, b) => b.count - a.count);

    const topReferrer: TopReferrer = referrerData.length > 0 && totalClicks > 0
      ? {
          name: referrerData[0].source,
          percentage: Math.round((referrerData[0].count / totalClicks) * 100),
        }
      : { name: "", percentage: 0 };

    // Time series data - generate based on period
    const timeSeriesData: TimeSeriesData[] = [];
    
    if (period === "all" || period === "custom") {
      // For all time or custom, group by day
      const dailyData: Record<string, number> = {};
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dailyData[dateStr] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      periodClicks.forEach((click) => {
        const clickDate = new Date(click.clickedAt);
        const dateStr = clickDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr]++;
        }
      });
      
      timeSeriesData.push(...Object.entries(dailyData).map(([date, clicks]) => ({
        date,
        clicks,
      })));
    } else {
      // For 7d and 30d, show daily data
      const dailyData: Record<string, number> = {};
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dailyData[dateStr] = 0;
      }
      
      periodClicks.forEach((click) => {
        const clickDate = new Date(click.clickedAt);
        const dateStr = clickDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr]++;
        }
      });
      
      timeSeriesData.push(...Object.entries(dailyData).map(([date, clicks]) => ({
        date,
        clicks,
      })));
    }

    return {
      clicks: periodClicks,
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
      // Only show loading on initial fetch
      if (!initialFetchDoneRef.current) {
        setLoading(true);
      }
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
      rawClicksRef.current = clicks;
      const processedData = processClicksData(clicks, timePeriod, customDateRange);
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
            id: url.id,
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
            shortUrl: url.shortUrl,
            customAlias: url.customAlias || null,
            expiryDate: url.expiryDate || null,
            createdAt: url.createdAt,
            version: url.version,
          });
        }
      }
      initialFetchDoneRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [shortCode, processClicksData, timePeriod, customDateRange]);

  // Initial fetch only when shortCode changes
  useEffect(() => {
    initialFetchDoneRef.current = false;
    fetchAnalytics();
  }, [shortCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reprocess data when time period changes (without refetching)
  useEffect(() => {
    if (initialFetchDoneRef.current && rawClicksRef.current.length > 0) {
      const processedData = processClicksData(rawClicksRef.current, timePeriod, customDateRange);
      setAnalyticsData(processedData);
    }
  }, [timePeriod, customDateRange, processClicksData]);

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
