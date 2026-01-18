import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { detectBot } from "@/lib/utils";
import { ShortUrlError } from "@/components/short-url/ShortUrlError";

export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ short_code: string }>;
}) {
  const { short_code } = await params;

  // Find URL by short code or custom alias (only latest version)
  const [urlRecord] = await db
    .select()
    .from(urls)
    .where(
      and(
        or(eq(urls.shortCode, short_code), eq(urls.customAlias, short_code)),
        eq(urls.isLatest, true)
      )
    )
    .limit(1);

  // If URL not found
  if (!urlRecord) {
    return (
      <ShortUrlError
        code="404"
        message={`Short URL "${short_code}" not found`}
      />
    );
  }

  // Check if URL has expired
  if (urlRecord.expiryDate && new Date(urlRecord.expiryDate) < new Date()) {
    return <ShortUrlError code="410" message="This short URL has expired" />;
  }

  // IMPORTANT: redirect() must be outside try-catch block!
  // In Next.js, redirect() throws a NEXT_REDIRECT error that the framework catches.
  // If wrapped in try-catch, this special error gets caught instead of propagating,
  // preventing the redirect from executing.
  
  // Record Analytics in the background (non-blocking) after redirect is initiated
  // This allows the user to be redirected immediately without waiting for DB operations
  (async () => {
    try {
      const headersList = await headers();
      const ip =
        headersList.get("cf-connecting-ip") ??
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
      const uaString = headersList.get("user-agent") ?? "";
      const ua = new UAParser(uaString).getResult();

      // GeoIP lookup requires a database file (e.g. MaxMind).
      // Using Vercel/Cloudflare headers if available.
      const country =
        headersList.get("cf-ipcountry") ?? headersList.get("x-vercel-ip-country");
      const city = headersList.get("x-vercel-ip-city");
      const region = headersList.get("x-vercel-ip-region");

      await db.insert(urlClicks).values({
        urlId: urlRecord.id,
        shortCode: urlRecord.shortCode,
        ipAddress: ip,
        userAgent: uaString,
        referrer: headersList.get("referer"),
        country: country?.substring(0, 2),
        region: region?.substring(0, 50),
        city: city?.substring(0, 50),
        deviceType: (ua.device.type ?? "desktop").substring(0, 20),
        os: ua.os.name?.substring(0, 50),
        browser: ua.browser.name?.substring(0, 50),
        isBot: detectBot(uaString),
      });
      console.log("Analytics recorded for:", urlRecord.shortCode);
    } catch (dbError) {
      console.error("Failed to record analytics:", dbError);
      // Silently fail - don't block user experience
    }
  })();

  redirect(urlRecord.originalUrl);
}
