"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsTimeFilter } from "@/components/analytics/AnalyticsTimeFilter";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { AnalyticsLocationList } from "@/components/analytics/AnalyticsLocationList";
import { AnalyticsTrafficSources } from "@/components/analytics/AnalyticsTrafficSources";
import type { TimePeriod, DateRange } from "@/types/analytics";

export default function AnalyticsPage() {
  const params = useParams();
  const shortCode = params.short_code as string;
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);

  const { loading, error, analyticsData, urlInfo, clicksChange, fetchAnalytics } = useAnalytics({
    shortCode,
    timePeriod,
    customDateRange,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
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
        <AnalyticsHeader
          urlInfo={urlInfo}
          onUrlUpdated={fetchAnalytics}
        />

        <AnalyticsTimeFilter
          selectedPeriod={timePeriod}
          customDateRange={customDateRange}
          onPeriodChange={setTimePeriod}
          onCustomRangeChange={setCustomDateRange}
        />

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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsLocationList
            locationData={analyticsData.locationData}
            totalClicks={analyticsData.totalClicks}
          />
          <AnalyticsTrafficSources referrerData={analyticsData.referrerData} />
        </div>
      </div>
    </div>
  );
}
