import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const originalUrl = body.originalUrl;
    const custom_alias = body.custom_alias;
    const expiryDate = body.expiryDate;
    return NextResponse.json({ message: "Hello" });
}