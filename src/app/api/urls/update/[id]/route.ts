import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isValidUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const urlId = parseInt(id, 10);
    if (isNaN(urlId)) {
      return NextResponse.json({ error: "Invalid URL ID" }, { status: 400 });
    }

    const body = await req.json();
    const { originalUrl, expiryDate } = body;

    // Fetch the current URL record
    const [currentUrl] = await db
      .select()
      .from(urls)
      .where(
        and(
          eq(urls.id, urlId),
          eq(urls.createdBy, session.user.id)
        )
      )
      .limit(1);

    if (!currentUrl) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Validate URL if provided
    if (originalUrl !== undefined && !isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const originalUrlChanged =
      originalUrl !== undefined && originalUrl !== currentUrl.originalUrl;
    
    // Detect expiry date changes - handle all cases:
    // 1. User sets a new expiry date (expiryDate is a date string)
    // 2. User clears the expiry date (expiryDate is null)
    // 3. User doesn't change it (expiryDate is undefined)
    let expiryDateChanged = false;
    if (expiryDate !== undefined) {
      const newExpiryTime = expiryDate ? new Date(expiryDate).getTime() : null;
      const currentExpiryTime = currentUrl.expiryDate ? new Date(currentUrl.expiryDate).getTime() : null;
      expiryDateChanged = newExpiryTime !== currentExpiryTime;
    }

    // If original URL changed, create a new version
    if (originalUrlChanged) {
      // Set current row's isLatest to false
      await db
        .update(urls)
        .set({ isLatest: false })
        .where(eq(urls.id, urlId));

      // Get the next version number
      const maxVersionResult = await db
        .select({
          maxVersion: sql<number>`MAX(${urls.version})`.as("maxVersion"),
        })
        .from(urls)
        .where(eq(urls.shortCode, currentUrl.shortCode));

      const nextVersion = (maxVersionResult[0]?.maxVersion ?? 0) + 1;

      // Create new version
      const parsedExpiryDate = expiryDate ? new Date(expiryDate) : currentUrl.expiryDate;
      const now = new Date();
      // Set updatedAt slightly after createdAt to indicate this is an update
      const updatedAtTime = new Date(now.getTime() + 1000);

      const [newVersion] = await db
        .insert(urls)
        .values({
          shortCode: currentUrl.shortCode,
          originalUrl: originalUrl,
          customAlias: currentUrl.customAlias,
          createdAt: now,
          updatedAt: updatedAtTime,
          expiryDate: parsedExpiryDate,
          version: nextVersion,
          isLatest: true,
          createdBy: session.user.id,
        })
        .returning();

      const baseUrl =
        (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

      return NextResponse.json({
        success: true,
        data: {
          id: newVersion.id,
          shortCode: newVersion.shortCode,
          originalUrl: newVersion.originalUrl,
          customAlias: newVersion.customAlias,
          shortUrl: `${baseUrl}/${newVersion.customAlias || newVersion.shortCode}`,
          expiryDate: newVersion.expiryDate,
          createdAt: newVersion.createdAt,
          updatedAt: newVersion.updatedAt,
          version: newVersion.version,
          isLatest: newVersion.isLatest,
        },
      });
    } else if (expiryDateChanged) {
      // Only expiry date changed, update in place
      const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

      const [updatedUrl] = await db
        .update(urls)
        .set({ 
          expiryDate: parsedExpiryDate,
          updatedAt: new Date(), // Explicitly set updatedAt
        })
        .where(eq(urls.id, urlId))
        .returning();

      const baseUrl =
        (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

      return NextResponse.json({
        success: true,
        data: {
          id: updatedUrl.id,
          shortCode: updatedUrl.shortCode,
          originalUrl: updatedUrl.originalUrl,
          customAlias: updatedUrl.customAlias,
          shortUrl: `${baseUrl}/${updatedUrl.customAlias || updatedUrl.shortCode}`,
          expiryDate: updatedUrl.expiryDate,
          createdAt: updatedUrl.createdAt,
          updatedAt: updatedUrl.updatedAt,
          version: updatedUrl.version,
          isLatest: updatedUrl.isLatest,
        },
      });
    } else {
      // No changes, return current URL
      const baseUrl =
        (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

      return NextResponse.json({
        success: true,
        data: {
          id: currentUrl.id,
          shortCode: currentUrl.shortCode,
          originalUrl: currentUrl.originalUrl,
          customAlias: currentUrl.customAlias,
          shortUrl: `${baseUrl}/${currentUrl.customAlias || currentUrl.shortCode}`,
          expiryDate: currentUrl.expiryDate,
          createdAt: currentUrl.createdAt,
          updatedAt: currentUrl.updatedAt,
          version: currentUrl.version,
          isLatest: currentUrl.isLatest,
        },
      });
    }
  } catch (error) {
    console.error("Error updating URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
