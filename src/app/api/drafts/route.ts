import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const drafts = await db
    .select()
    .from(tweetDrafts)
    .where(and(eq(tweetDrafts.user_id, session.user.id), isNull(tweetDrafts.deleted_at)))
    .orderBy(desc(tweetDrafts.created_at));

  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { tweet_boxes } = await req.json();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const draft = await db
    .insert(tweetDrafts)
    .values({
      user_id: session.user.id,
      tweet_boxes,
      status: "draft",
    })
    .returning();

  return NextResponse.json(draft[0]);
}
