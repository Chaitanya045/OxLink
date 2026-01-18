import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import {
  generateShortCode,
  generateRandomShortCode,
  isValidUrl,
} from "@/lib/utils";
import { eq, desc, asc, sql, inArray, and, or, ilike, isNull, gt, lte, isNotNull } from "drizzle-orm";
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

    // Get pagination and search parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const searchParam = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim() || "all";
    const sortByParam = searchParams.get("sortBy")?.trim() || "date";
    const sortOrderParam = searchParams.get("sortOrder")?.trim() || "desc";
    
    // Validate and parse page parameter (default to 1, minimum 1)
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    
    // Validate and parse limit parameter (default to 10, minimum 1, maximum 100)
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || "10", 10) || 10));
    
    const offset = (page - 1) * limit;

    // Build base where conditions
    const baseConditions = and(
      eq(urls.createdBy, session.user.id),
      eq(urls.isLatest, true)
    );

    // Add status filter conditions
    let statusConditions = undefined;
    if (statusParam === "active") {
      // Active: expiryDate IS NULL OR expiryDate > NOW()
      statusConditions = or(
        isNull(urls.expiryDate),
        gt(urls.expiryDate, sql`NOW()`)
      );
    } else if (statusParam === "inactive") {
      // Inactive: expiryDate IS NOT NULL AND expiryDate <= NOW()
      statusConditions = and(
        isNotNull(urls.expiryDate),
        lte(urls.expiryDate, sql`NOW()`)
      );
    }
    // For "all", no status filter is applied

    // Combine base conditions with status conditions
    let whereConditions = statusConditions
      ? and(baseConditions, statusConditions)
      : baseConditions;

    // Add search conditions if search term is provided
    if (searchParam) {
      const searchPattern = `%${searchParam}%`;
      whereConditions = and(
        whereConditions,
        or(
          ilike(urls.shortCode, searchPattern),
          ilike(urls.customAlias, searchPattern),
          ilike(urls.originalUrl, searchPattern)
        )
      );
    }

    // Get total count for pagination (with search filter if applicable)
    const totalUrls = await db
      .select()
      .from(urls)
      .where(whereConditions);

    const totalCount = totalUrls.length;

    // Get all URL IDs that match the filters (for click counting)
    const allUrlIds = totalUrls.map((url) => url.id);
    
    // Get click counts for all matching URLs
    const clickCountsMap = new Map<number, number>();
    
    if (allUrlIds.length > 0) {
      const clickCounts = await db
        .select({
          urlId: urlClicks.urlId,
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(urlClicks)
        .where(inArray(urlClicks.urlId, allUrlIds))
        .groupBy(urlClicks.urlId);
      
      clickCounts.forEach((row) => {
        clickCountsMap.set(row.urlId, Number(row.count));
      });
    }

    // Get paginated URLs with appropriate sorting
    let userUrls;
    
    if (sortByParam === "clicks") {
      // For clicks sorting, we need to sort all filtered URLs by click count, then paginate
      const allFilteredUrls = await db
        .select()
        .from(urls)
        .where(whereConditions);
      
      // Sort by click count
      const sortedUrls = allFilteredUrls.sort((a, b) => {
        const aClicks = clickCountsMap.get(a.id) ?? 0;
        const bClicks = clickCountsMap.get(b.id) ?? 0;
        return sortOrderParam === "asc" ? aClicks - bClicks : bClicks - aClicks;
      });
      
      // Apply pagination
      userUrls = sortedUrls.slice(offset, offset + limit);
    } else {
      // For date sorting, we need to sort by updatedAt (if different from createdAt) or createdAt
      // Fetch all filtered URLs to sort by effective date (updatedAt > createdAt, else createdAt)
      const allFilteredUrls = await db
        .select()
        .from(urls)
        .where(whereConditions);
      
      // Sort by effective date (updatedAt if it's different from createdAt, otherwise createdAt)
      const sortedUrls = allFilteredUrls.sort((a, b) => {
        // Get effective date for each URL: updatedAt if significantly different, else createdAt
        const getEffectiveDate = (url: typeof urls.$inferSelect): Date => {
          if (url.updatedAt && url.updatedAt !== url.createdAt) {
            const diffMs = new Date(url.updatedAt).getTime() - new Date(url.createdAt).getTime();
            // If updatedAt is significantly different (more than 1 second), use it
            if (Math.abs(diffMs) >= 1000) {
              return new Date(url.updatedAt);
            }
          }
          return new Date(url.createdAt);
        };
        
        const aDate = getEffectiveDate(a).getTime();
        const bDate = getEffectiveDate(b).getTime();
        return sortOrderParam === "asc" ? aDate - bDate : bDate - aDate;
      });
      
      // Apply pagination
      userUrls = sortedUrls.slice(offset, offset + limit);
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

    const data = userUrls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      customAlias: url.customAlias,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
      expiryDate: url.expiryDate,
      shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
      clickCount: clickCountsMap.get(url.id) ?? 0,
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
            (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")
          }/${newUrl.customAlias || newUrl.shortCode}`,
          expiryDate: newUrl.expiryDate,
          createdAt: newUrl.createdAt,
          updatedAt: newUrl.updatedAt,
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
