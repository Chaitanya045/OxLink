"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleTopPerformingClick = () => {
    if (topPerforming) {
      const shortCode = topPerforming.customAlias || topPerforming.shortCode;
      router.push(`/analytics/${shortCode}`);
    }
  };

  const getShortUrlDisplay = (url: Url) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const shortCode = url.customAlias || url.shortCode;
    try {
      const urlObj = new URL(baseUrl);
      return `${urlObj.host}/${shortCode}`;
    } catch {
      // Fallback: extract domain from baseUrl string
      const match = baseUrl.match(/https?:\/\/([^\/]+)/);
      if (match) {
        return `${match[1]}/${shortCode}`;
      }
      return shortCode;
    }
  };

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
      <Card
        className={topPerforming ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
        onClick={topPerforming ? handleTopPerformingClick : undefined}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              TOP PERFORMING
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-xl font-bold truncate">
            {topPerforming
              ? getShortUrlDisplay(topPerforming)
              : "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">
            {topPerforming
              ? `${topPerforming.clickCount ?? 0} ${(topPerforming.clickCount ?? 0) === 1 ? "click" : "clicks"}`
              : "No data"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
