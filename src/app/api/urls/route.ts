import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls } from "@/db/schema";
import {
  generateShortCode,
  generateRandomShortCode,
  isValidUrl,
} from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
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

    // Check if short code already exists (hash collision)
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

    // If custom alias provided, validate it
    if (customAlias) {
      const existingAlias = await db
        .select()
        .from(urls)
        .where(eq(urls.customAlias, customAlias))
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
