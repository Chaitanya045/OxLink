import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import { eq, sql, inArray, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all user's URLs (only latest versions)
    const userUrls = await db
      .select({
        id: urls.id,
        shortCode: urls.shortCode,
        customAlias: urls.customAlias,
        originalUrl: urls.originalUrl,
        createdAt: urls.createdAt,
        expiryDate: urls.expiryDate,
      })
      .from(urls)
      .where(
        and(
          eq(urls.createdBy, session.user.id),
          eq(urls.isLatest, true)
        )
      );

    if (userUrls.length === 0) {
      return NextResponse.json({
        totalClicks: 0,
        topPerforming: null,
      });
    }

    // Get all short codes for this user
    const shortCodes = userUrls.map((url) => url.shortCode);

    // Get click counts grouped by shortCode
    const clickCounts = await db
      .select({
        shortCode: urlClicks.shortCode,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(urlClicks)
      .where(inArray(urlClicks.shortCode, shortCodes))
      .groupBy(urlClicks.shortCode);

    // Create a map of shortCode -> clickCount
    const clickCountsMap = new Map<string, number>();
    clickCounts.forEach((row) => {
      clickCountsMap.set(row.shortCode, Number(row.count));
    });

    // Calculate total clicks across all URLs
    const totalClicks = Array.from(clickCountsMap.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Find top performing URL (highest click count)
    let topPerforming: {
      id: number;
      shortCode: string;
      customAlias: string | null;
      originalUrl: string;
      clickCount: number;
      shortUrl: string;
    } | null = null;

    let maxClicks = 0;
    for (const url of userUrls) {
      const clicks = clickCountsMap.get(url.shortCode) ?? 0;
      if (clicks > maxClicks) {
        maxClicks = clicks;
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        topPerforming = {
          id: url.id,
          shortCode: url.shortCode,
          customAlias: url.customAlias,
          originalUrl: url.originalUrl,
          clickCount: clicks,
          shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
        };
      }
    }

    return NextResponse.json({
      totalClicks,
      topPerforming,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
