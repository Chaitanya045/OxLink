import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urlClicks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ short_code: string }> }
) {
  try {
    const short_code = (await params).short_code;

    const urlClicksData = await db
      .select()
      .from(urlClicks)
      .where(eq(urlClicks.shortCode, short_code))
      .limit(1);

    return NextResponse.json({ urlClicksData });
  } catch (error) {
    console.error("Error fetching short URL analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
