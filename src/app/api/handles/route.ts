import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { twitterHandles } from "@/lib/db-schema";
import { isNull } from "drizzle-orm";

export async function GET() {
  try {
    const handles = await db
      .select({
        handle: twitterHandles.handle,
        pfp: twitterHandles.pfp,
        url: twitterHandles.url,
      })
      .from(twitterHandles)
      .where(isNull(twitterHandles.deleted_at))
      .orderBy(twitterHandles.created_at);

    return NextResponse.json(handles);
  } catch (error) {
    console.error("Error fetching handles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
