import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in to list your short URLs." },
                { status: 401 }
            );
        }
        const userId = session.user.id;
        const userUrls = await db
            .select()
            .from(urls)
            .where(eq(urls.createdBy, userId));
        return NextResponse.json({ userUrls }, { status: 200 });
    } catch (error) {
        console.error("Error fetching URLs:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
