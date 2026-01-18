import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urlClicks, urls } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ short_code: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthenticated. Please sign in to view analytics." },
        { status: 401 }
      );
    }

    const short_code = (await params).short_code;
    const userId = session.user.id;

    // Find the URL to verify ownership (only latest version)
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

    if (!urlRecord) {
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 }
      );
    }

    // Check if the URL belongs to the authenticated user
    if (urlRecord.createdBy !== userId) {
      return NextResponse.json(
        { error: "Forbidden. You do not have access to this URL's analytics." },
        { status: 403 }
      );
    }

    // Fetch all analytics data for this URL version (by urlId, not shortCode)
    const urlClicksData = await db
      .select()
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlRecord.id));

    return NextResponse.json({ urlClicksData });
  } catch (error) {
    console.error("Error fetching short URL analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
