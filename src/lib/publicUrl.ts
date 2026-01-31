import { absoluteAppUrl } from "@/lib/paths";

function stripLeadingSlash(value: string): string {
  return value.replace(/^\//, "");
}

export function getPublicBaseUrl(): string {
  return absoluteAppUrl("/");
}

export function buildPublicShortUrl(shortCodeOrAlias: string): string {
  const code = stripLeadingSlash(shortCodeOrAlias);
  return absoluteAppUrl(`/${code}`);
}
