export const APP_BASE_PATH = "/oxlink";

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

// Use this for API calls (fetch) since Next basePath is not applied automatically.
export function apiPath(pathname: string): string {
  const path = ensureLeadingSlash(pathname);
  return `${APP_BASE_PATH}${path}`;
}

// Server-only helper for absolute URLs (SSR fetches)
export function getPublicOrigin(): string {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
}

export function absoluteAppUrl(pathname: string): string {
  return `${getPublicOrigin()}${apiPath(pathname)}`;
}
