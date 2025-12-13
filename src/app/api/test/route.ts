import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    return NextResponse.json({ message: "API and DB are working", result });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json(
      { error: "Database connection failed", details: String(error) },
      { status: 500 }
    );
  }
}
