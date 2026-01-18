import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import {
  generateShortCode,
  generateRandomShortCode,
  isValidUrl,
} from "@/lib/utils";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
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

    // Get pagination parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    // Validate and parse page parameter (default to 1, minimum 1)
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    
    // Validate and parse limit parameter (default to 10, minimum 1, maximum 100)
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || "10", 10) || 10));
    
    const offset = (page - 1) * limit;

    // Get total count for pagination (only latest versions)
    const totalUrls = await db
      .select()
      .from(urls)
      .where(
        and(
          eq(urls.createdBy, session.user.id),
          eq(urls.isLatest, true)
        )
      );

    const totalCount = totalUrls.length;

    // Get paginated URLs (only latest versions)
    const userUrls = await db
      .select()
      .from(urls)
      .where(
        and(
          eq(urls.createdBy, session.user.id),
          eq(urls.isLatest, true)
        )
      )
      .orderBy(desc(urls.createdAt))
      .limit(limit)
      .offset(offset);

    // Get click counts for these URLs
    const shortCodes = userUrls.map((url) => url.shortCode);
    const clickCountsMap = new Map<string, number>();
    
    if (shortCodes.length > 0) {
      const clickCounts = await db
        .select({
          shortCode: urlClicks.shortCode,
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(urlClicks)
        .where(inArray(urlClicks.shortCode, shortCodes))
        .groupBy(urlClicks.shortCode);
      
      clickCounts.forEach((row) => {
        clickCountsMap.set(row.shortCode, Number(row.count));
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const data = userUrls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      customAlias: url.customAlias,
      createdAt: url.createdAt,
      expiryDate: url.expiryDate,
      shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
      clickCount: clickCountsMap.get(url.shortCode) ?? 0,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create short URLs." },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { originalUrl, customAlias, expiryDate } = body;

    // Validate required fields
    if (!originalUrl) {
      return NextResponse.json(
        { error: "originalUrl is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Generate short code from URL using SHA-256
    let shortCode = generateShortCode(originalUrl);

    // Check if short code already exists (hash collision) - check all versions
    // We need to check all versions because shortCode+version is unique, not just shortCode
    let existingUrl = await db
      .select()
      .from(urls)
      .where(eq(urls.shortCode, shortCode))
      .limit(1);

    // If collision, generate random short code
    while (existingUrl.length > 0) {
      shortCode = generateRandomShortCode();
      existingUrl = await db
        .select()
        .from(urls)
        .where(eq(urls.shortCode, shortCode))
        .limit(1);
    }

    // If custom alias provided, validate it (check only latest versions)
    if (customAlias) {
      const existingAlias = await db
        .select()
        .from(urls)
        .where(
          and(
            eq(urls.customAlias, customAlias),
            eq(urls.isLatest, true)
          )
        )
        .limit(1);

      if (existingAlias.length > 0) {
        return NextResponse.json(
          { error: "Custom alias already exists" },
          { status: 409 }
        );
      }
    }

    // Parse expiry date if provided
    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

    // Insert into database
    const [newUrl] = await db
      .insert(urls)
      .values({
        originalUrl,
        shortCode,
        customAlias: customAlias || null,
        expiryDate: parsedExpiryDate,
        version: 1,
        isLatest: true,
        createdBy: session.user.id,
      })
      .returning();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUrl.id,
          shortCode: newUrl.shortCode,
          originalUrl: newUrl.originalUrl,
          customAlias: newUrl.customAlias,
          shortUrl: `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/${newUrl.customAlias || newUrl.shortCode}`,
          expiryDate: newUrl.expiryDate,
          createdAt: newUrl.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
