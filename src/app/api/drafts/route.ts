import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const drafts = await db
    .select()
    .from(tweetDrafts)
    .where(and(eq(tweetDrafts.user_id, user_id), isNull(tweetDrafts.deleted_at)));

  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  const { user_id, tweet_boxes } = await req.json();
  if (!user_id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const draft = await db
    .insert(tweetDrafts)
    .values({
      user_id,
      tweet_boxes,
      status: "draft",
    })
    .returning();

  return NextResponse.json(draft[0]);
}
