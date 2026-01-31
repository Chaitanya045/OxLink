import type {
  AnalyticsData,
  DateRange,
  DeviceData,
  LocationData,
  ReferrerData,
  TimePeriod,
  TimeSeriesData,
  TopLocation,
  TopReferrer,
  UrlClick,
} from "@/types/analytics";

export function computeAnalyticsFromClicks(
  clicks: UrlClick[],
  period: TimePeriod,
  dateRange: DateRange | null
): AnalyticsData {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  let periodDays: number;

  if (period === "custom" && dateRange) {
    startDate = new Date(dateRange.start);
    endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);
    periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else if (period === "1h") {
    startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    periodDays = 1;
  } else if (period === "24h") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    periodDays = 1;
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
    const earliestClick =
      clicks.length > 0
        ? new Date(
            Math.min(...clicks.map((c) => new Date(c.clickedAt).getTime()))
          )
        : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    startDate = new Date(earliestClick);
    startDate.setHours(0, 0, 0, 0);
    periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const periodClicks = clicks.filter((c) => {
    const clickDate = new Date(c.clickedAt);
    return clickDate >= startDate && clickDate <= endDate;
  });

  let previousPeriodClicks = 0;
  if (period === "1h" || period === "24h" || period === "7d" || period === "30d") {
    const previousStartDate = new Date(startDate);
    if (period === "1h") {
      previousStartDate.setTime(previousStartDate.getTime() - 1 * 60 * 60 * 1000);
    } else if (period === "24h") {
      previousStartDate.setTime(previousStartDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    }

    const previousEndDate = new Date(startDate);
    previousEndDate.setMilliseconds(previousEndDate.getMilliseconds() - 1);

    previousPeriodClicks = clicks.filter((c) => {
      const clickDate = new Date(c.clickedAt);
      return clickDate >= previousStartDate && clickDate <= previousEndDate;
    }).length;
  }

  const totalClicks = periodClicks.length;
  const total = periodClicks.length;

  const uniqueVisitors = new Set(
    periodClicks.map((c) => c.ipAddress).filter(Boolean)
  ).size;

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

  const locationBreakdown: Record<string, number> = {};
  periodClicks.forEach((click) => {
    const country = click.country || "Unknown";
    locationBreakdown[country] = (locationBreakdown[country] || 0) + 1;
  });

  const locationData: LocationData[] = Object.entries(locationBreakdown)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const topLocation: TopLocation =
    locationData.length > 0 && totalClicks > 0
      ? {
          name: locationData[0].country,
          percentage: Math.round((locationData[0].count / totalClicks) * 100),
        }
      : { name: "", percentage: 0 };

  const referrerBreakdown: Record<string, number> = {};
  periodClicks.forEach((click) => {
    let source = "Direct / Email";
    if (click.referrer) {
      try {
        const u = new URL(click.referrer);
        source = u.hostname.replace("www.", "");
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

  const topReferrer: TopReferrer =
    referrerData.length > 0 && totalClicks > 0
      ? {
          name: referrerData[0].source,
          percentage: Math.round((referrerData[0].count / totalClicks) * 100),
        }
      : { name: "", percentage: 0 };

  const timeSeriesData: TimeSeriesData[] = [];

  if (period === "1h" || period === "24h") {
    const bucketMs = period === "1h" ? 5 * 60 * 1000 : 60 * 60 * 1000;
    const buckets: Record<string, number> = {};
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    const alignedStart = Math.floor(startMs / bucketMs) * bucketMs;
    const alignedEnd = Math.ceil(endMs / bucketMs) * bucketMs;

    for (let t = alignedStart; t <= alignedEnd; t += bucketMs) {
      const d = new Date(t);
      const label = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      buckets[label] = 0;
    }

    for (const click of periodClicks) {
      const clickedAt = new Date(click.clickedAt).getTime();
      const t = Math.floor(clickedAt / bucketMs) * bucketMs;
      const d = new Date(t);
      const label = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      if (buckets[label] !== undefined) buckets[label]++;
    }

    timeSeriesData.push(
      ...Object.entries(buckets).map(([date, clicksCount]) => ({
        date,
        clicks: clicksCount,
      }))
    );
  } else if (period === "all" || period === "custom") {
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

    timeSeriesData.push(
      ...Object.entries(dailyData).map(([date, clicksCount]) => ({
        date,
        clicks: clicksCount,
      }))
    );
  } else {
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

    timeSeriesData.push(
      ...Object.entries(dailyData).map(([date, clicksCount]) => ({
        date,
        clicks: clicksCount,
      }))
    );
  }

  return {
    clicks: periodClicks,
    totalClicks,
    uniqueVisitors,
    previousPeriodClicks,
    deviceData,
    locationData,
    referrerData,
    timeSeriesData,
    topReferrer,
    topLocation,
  };
}
