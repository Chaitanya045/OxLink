import { Card, CardContent } from "@/components/ui/card";
import {
  MousePointer,
  Users,
  Globe,
  MapPin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { TopReferrer, TopLocation } from "@/types/analytics";

interface AnalyticsOverviewProps {
  totalClicks: number;
  uniqueVisitors: number;
  topReferrer: TopReferrer;
  topLocation: TopLocation;
  clicksChange: number;
}

export function AnalyticsOverview({
  totalClicks,
  uniqueVisitors,
  topReferrer,
  topLocation,
  clicksChange,
}: AnalyticsOverviewProps) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Clicks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm text-muted-foreground">TOTAL CLICKS</div>
              <MousePointer className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {totalClicks.toLocaleString()}
            </div>
            <div
              className={`flex items-center text-sm ${
                clicksChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {clicksChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(clicksChange).toFixed(1)}% vs last period
            </div>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                UNIQUE VISITORS
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {uniqueVisitors.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">vs last period</div>
          </CardContent>
        </Card>

        {/* Top Referrer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm text-muted-foreground">TOP REFERRER</div>
              <Globe className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{topReferrer.name}</div>
            <div className="text-sm text-muted-foreground">
              {topReferrer.percentage}% of total traffic
            </div>
          </CardContent>
        </Card>

        {/* Top Location */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm text-muted-foreground">TOP LOCATION</div>
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{topLocation.name}</div>
            <div className="text-sm text-muted-foreground">
              {topLocation.percentage}% of total clicks
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
