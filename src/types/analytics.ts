export type TimePeriod = "7d" | "30d" | "all" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface UrlClick {
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
}

export interface TimeSeriesData {
  date: string;
  clicks: number;
}

export interface DeviceData {
  name: string;
  value: number;
  percentage: number;
}

export interface LocationData {
  country: string;
  count: number;
}

export interface ReferrerData {
  source: string;
  count: number;
  change: number;
}

export interface TopReferrer {
  name: string;
  percentage: number;
}

export interface TopLocation {
  name: string;
  percentage: number;
}

export interface AnalyticsData {
  clicks: UrlClick[];
  totalClicks: number;
  uniqueVisitors: number;
  previousPeriodClicks: number;
  deviceData: DeviceData[];
  locationData: LocationData[];
  referrerData: ReferrerData[];
  timeSeriesData: TimeSeriesData[];
  topReferrer: TopReferrer;
  topLocation: TopLocation;
}

export interface UrlInfo {
  id: number;
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  customAlias: string | null;
  expiryDate: string | null;
  createdAt: string;
  version?: number;
}
