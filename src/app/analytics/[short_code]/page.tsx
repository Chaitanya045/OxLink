"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Copy,
  Share2,
  QrCode,
  Edit,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type UrlClick = {
  id: number;
  urlId: number;
  clickedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  shortCode: string;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  isBot: boolean;
};

type TimeSeriesData = {
  date: string;
  clicks: number;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.short_code as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clicksData, setClicksData] = useState<UrlClick[]>([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [topReferrer, setTopReferrer] = useState<{
    name: string;
    percentage: number;
  }>({ name: "", percentage: 0 });
  const [topLocation, setTopLocation] = useState<{
    name: string;
    percentage: number;
  }>({ name: "", percentage: 0 });
  const [deviceData, setDeviceData] = useState<
    { name: string; value: number; percentage: number }[]
  >([]);
  const [locationData, setLocationData] = useState<
    { country: string; count: number }[]
  >([]);
  const [referrerData, setReferrerData] = useState<
    { source: string; count: number; change: number }[]
  >([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [previousPeriodClicks, setPreviousPeriodClicks] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/urls/${shortCode}/analytics`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch analytics");
      }

      const data = await response.json();
      const clicks: UrlClick[] = data.urlClicksData;
      setClicksData(clicks);

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
          setOriginalUrl(url.originalUrl);
          setShortUrl(url.shortUrl);
        }
      }

      // Calculate statistics
      const total = clicks.length;
      setTotalClicks(total);

      const uniqueIps = new Set(clicks.map((c) => c.ipAddress).filter(Boolean))
        .size;
      setUniqueVisitors(uniqueIps);

      // Calculate previous period (for comparison)
      const now = new Date();
      const last7Days = clicks.filter((c) => {
        const clickDate = new Date(c.clickedAt);
        const daysAgo =
          (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });
      const previous7Days = clicks.filter((c) => {
        const clickDate = new Date(c.clickedAt);
        const daysAgo =
          (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo > 7 && daysAgo <= 14;
      });
      setPreviousPeriodClicks(previous7Days.length);

      // Device breakdown
      const deviceBreakdown: { [key: string]: number } = {};
      clicks.forEach((click) => {
        const device = click.deviceType || "Unknown";
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
      });

      const deviceArray = Object.entries(deviceBreakdown).map(
        ([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          percentage: Math.round((value / total) * 100),
        })
      );
      setDeviceData(deviceArray);

      // Location breakdown
      const locationBreakdown: { [key: string]: number } = {};
      clicks.forEach((click) => {
        const country = click.country || "Unknown";
        locationBreakdown[country] = (locationBreakdown[country] || 0) + 1;
      });

      const locationArray = Object.entries(locationBreakdown)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setLocationData(locationArray);

      if (locationArray.length > 0) {
        setTopLocation({
          name: locationArray[0].country,
          percentage: Math.round((locationArray[0].count / total) * 100),
        });
      }

      // Referrer breakdown
      const referrerBreakdown: { [key: string]: number } = {};
      clicks.forEach((click) => {
        let source = "Direct / Email";
        if (click.referrer) {
          try {
            const url = new URL(click.referrer);
            source = url.hostname.replace("www.", "");
            if (source.includes("twitter") || source.includes("t.co"))
              source = "Twitter / X";
            else if (source.includes("linkedin")) source = "LinkedIn";
            else if (source.includes("facebook")) source = "Facebook";
          } catch {
            source = "Others";
          }
        }
        referrerBreakdown[source] = (referrerBreakdown[source] || 0) + 1;
      });

      const referrerArray = Object.entries(referrerBreakdown)
        .map(([source, count]) => ({ source, count, change: 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setReferrerData(referrerArray);

      if (referrerArray.length > 0) {
        setTopReferrer({
          name: referrerArray[0].source,
          percentage: Math.round((referrerArray[0].count / total) * 100),
        });
      }

      // Time series data (last 7 days)
      const last7DaysData: { [key: string]: number } = {};
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
        const daysAgo =
          (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
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

      const timeSeriesArray = Object.entries(last7DaysData).map(
        ([date, clicks]) => ({
          date,
          clicks,
        })
      );
      setTimeSeriesData(timeSeriesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [shortCode]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clicksChange =
    previousPeriodClicks > 0
      ? ((totalClicks - previousPeriodClicks) / previousPeriodClicks) * 100
      : 0;

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
  ];

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">Analytics</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">ox.link/{shortCode}</h1>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4 rotate-180" />
              <span>Redirects to: </span>
              <span className="text-foreground truncate max-w-md">
                {originalUrl}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(shortUrl)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="icon">
              <QrCode className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm">
            Last 7 Days
          </Button>
          <Button variant="ghost" size="sm">
            Last 30 Days
          </Button>
          <Button variant="ghost" size="sm">
            All Time
          </Button>
          <Button variant="ghost" size="sm">
            Custom
          </Button>
        </div>

        {/* Overview Section */}
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Clicks */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  TOTAL CLICKS
                </div>
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
              <div className="text-sm text-muted-foreground">
                vs last period
              </div>
            </CardContent>
          </Card>

          {/* Top Referrer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  TOP REFERRER
                </div>
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
                <div className="text-sm text-muted-foreground">
                  TOP LOCATION
                </div>
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold mb-1">{topLocation.name}</div>
              <div className="text-sm text-muted-foreground">
                {topLocation.percentage}% of total clicks
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Click Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Click Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Devices Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {deviceData.map((device, index) => (
                  <div
                    key={device.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span>{device.name}</span>
                    </div>
                    <span className="font-semibold">{device.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Locations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Locations</CardTitle>
                <Button variant="link" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationData.map((location, index) => (
                  <div key={location.country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌍</span>
                        <span className="font-medium">{location.country}</span>
                      </div>
                      <span className="font-semibold">
                        {location.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(location.count / totalClicks) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Traffic Sources</CardTitle>
                <Button variant="link" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrerData.map((referrer) => (
                  <div
                    key={referrer.source}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{referrer.source}</div>
                        <div className="text-sm text-muted-foreground">
                          Social Media
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {referrer.count.toLocaleString()}
                      </div>
                      {referrer.change !== 0 && (
                        <div
                          className={`text-sm ${
                            referrer.change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {referrer.change >= 0 ? "+" : ""}
                          {referrer.change}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
