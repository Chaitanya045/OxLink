import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls } from "@/db/schema";
import { eq, or } from "drizzle-orm";

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
