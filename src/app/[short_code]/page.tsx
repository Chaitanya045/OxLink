import { redirect, RedirectType } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { detectBot } from "@/lib/utils";

export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ short_code: string }>;
}) {
  const { short_code } = await params;

  // Find URL by short code or custom alias
  const [urlRecord] = await db
    .select()
    .from(urls)
    .where(
      or(eq(urls.shortCode, short_code), eq(urls.customAlias, short_code))
    )
    .limit(1);

  // If URL not found
  if (!urlRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground">
            Short URL &quot;{short_code}&quot; not found
          </p>
        </div>
      </div>
    );
  }

  // Check if URL has expired
  if (urlRecord.expiryDate && new Date(urlRecord.expiryDate) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">410</h1>
          <p className="text-muted-foreground">
            This short URL has expired
          </p>
        </div>
      </div>
    );
  }

  // Record Analytics (Non-blocking)
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
    // Don't block redirect if analytics fails
  }

  // Redirect to original URL
  redirect(urlRecord.originalUrl);
}
