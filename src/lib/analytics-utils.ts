import type { Url } from "@/types/dashboard";

export function isUrlActive(expiryDate: string | null): boolean {
  if (!expiryDate) return true;
  return new Date(expiryDate) > new Date();
}

export function getIconForUrl(url: Url): string {
  if (
    url.originalUrl.includes("marketing") ||
    url.originalUrl.includes("campaign")
  ) {
    return "📢";
  } else if (
    url.originalUrl.includes("wiki") ||
    url.originalUrl.includes("docs")
  ) {
    return "📄";
  } else if (
    url.originalUrl.includes("social") ||
    url.originalUrl.includes("bio")
  ) {
    return "👤";
  } else if (
    url.originalUrl.includes("shop") ||
    url.originalUrl.includes("offer")
  ) {
    return "🎁";
  }
  return "🔗";
}

export function getTimeSince(date: string): string {
  const now = new Date();
  const created = new Date(date);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60)
    return `Created ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24)
    return `Created ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  return `Created ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}
