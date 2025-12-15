import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { detectBot } from "../../../../lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ short_code: string }> }
) {
  try {
    const short_code = (await params).short_code;

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
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 }
      );
    }

    // Record Analytics (Non-blocking)
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const uaString = req.headers.get("user-agent") ?? "";
    const ua = new UAParser(uaString).getResult();

    // GeoIP lookup requires a database file (e.g. MaxMind).
    // Using Vercel/Cloudflare headers if available.
    const country =
      req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
    const city = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-region");

    // We start the insert but don't await it to avoid blocking the redirect (optional optimization,
    // but usually safer to await in serverless to ensure it finishes).
    // We'll await it here for reliability.
    try {
      await db.insert(urlClicks).values({
        urlId: urlRecord.id,
        shortCode: urlRecord.shortCode, // Required field
        ipAddress: ip,
        userAgent: uaString,
        referrer: req.headers.get("referer"),
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

    // Check if URL has expired
    if (urlRecord.expiryDate && new Date(urlRecord.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: "This short URL has expired" },
        { status: 410 }
      );
    }

    // Redirect to original URL with 302 status (temporary redirect)
    return NextResponse.redirect(urlRecord.originalUrl, 302);
  } catch (error) {
    console.error("Error fetching short URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
