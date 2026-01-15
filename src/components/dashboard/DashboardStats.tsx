import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon, BarChart3, Star, TrendingUp } from "lucide-react";
import type { Url } from "@/types/dashboard";

interface DashboardStatsProps {
  totalCount: number;
  totalClicks: number;
  topPerforming: Url | null;
}

export function DashboardStats({
  totalCount,
  totalClicks,
  topPerforming,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Links */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-muted-foreground">TOTAL LINKS</div>
            <LinkIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{totalCount}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Clicks */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-muted-foreground">TOTAL CLICKS</div>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">
              {totalClicks.toLocaleString()}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              TOP PERFORMING
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-xl font-bold truncate">
            {topPerforming
              ? `ox.link/${
                  topPerforming.customAlias || topPerforming.shortCode
                }`
              : "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">
            {topPerforming ? "45 clicks in last 24h" : "No data"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
