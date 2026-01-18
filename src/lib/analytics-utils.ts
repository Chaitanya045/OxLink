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

export function getTimeSinceWithLabel(
  createdAt: string,
  updatedAt?: string
): string {
  // If no updatedAt or updatedAt equals createdAt, show created time
  if (!updatedAt || updatedAt === createdAt) {
    return getTimeSince(createdAt);
  }

  // Check if updatedAt is significantly different from createdAt (more than 1 second)
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const diffMs = updated.getTime() - created.getTime();

  // If updatedAt is essentially the same as createdAt (within 1 second), show created
  if (Math.abs(diffMs) < 1000) {
    return getTimeSince(createdAt);
  }

  // Otherwise, show updated time
  const now = new Date();
  const diffMsFromNow = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMsFromNow / 60000);
  const diffHours = Math.floor(diffMsFromNow / 3600000);
  const diffDays = Math.floor(diffMsFromNow / 86400000);

  if (diffMins < 60)
    return `Updated ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24)
    return `Updated ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  return `Updated ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}
