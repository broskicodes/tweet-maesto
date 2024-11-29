import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTwitterClient } from "../../twitterClient";

export async function POST(req: Request, { params }: { params: { draftId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { scheduledFor } = await req.json();
    if (!scheduledFor) {
      return new NextResponse("Schedule time is required", { status: 400 });
    }

    // 1. Get the draft
    const draft = await db.query.tweetDrafts.findFirst({
      where: and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)),
    });

    if (!draft) {
      return new NextResponse("Draft not found", { status: 404 });
    }

    // 2. Schedule with Twitter API
    const twitterClient = await createTwitterClient(session.user.id);
    // const scheduledTweet = await twitterClient.v2.sche(draft.tweet_boxes);

    // 3. Update draft status
    const updated = await db
      .update(tweetDrafts)
      .set({
        status: "scheduled",
        scheduled_for: new Date(scheduledFor),
        updated_at: new Date(),
      })
      .where(and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to schedule tweet:", error);
    return new NextResponse("Failed to schedule tweet", { status: 500 });
  }
}
