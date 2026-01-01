import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if table exists
    const tableCheck: any = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'url_clicks'
      );
    `);

    // Get count if it exists
    let count = "Table not found";
    let recent: any = [];

    if (tableCheck[0]?.exists) {
      const countResult: any = await db.execute(
        sql`SELECT COUNT(*) FROM url_clicks`
      );
      count = countResult[0]?.count;

      const recentResult = await db.execute(
        sql`SELECT * FROM url_clicks ORDER BY clicked_at DESC LIMIT 5`
      );
      recent = recentResult;
    }

    return NextResponse.json({
      tableExists: tableCheck[0]?.exists,
      count,
      recent,
    });
  } catch (error) {
    console.error("Test Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
