import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTwitterClient } from "../../twitterClient";
import { TweetBox } from "@/store/drafts";

export async function POST(req: Request, { params }: { params: { draftId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Get the draft
    const draft = await db.query.tweetDrafts.findFirst({
      where: and(
        eq(tweetDrafts.id, params.draftId),
        eq(tweetDrafts.user_id, session.user.id)
      ),
    });

    if (!draft) {
      return new NextResponse("Draft not found", { status: 404 });
    }

    // 2. Post to Twitter using their API
    const twitterClient = await createTwitterClient(session.user.id);
    await twitterClient.v2.tweetThread((draft.tweet_boxes as TweetBox[]).map((tweetBox) => ({
      // media: tweetBox.media,
      text: tweetBox.content,
    })));

    // 3. Update draft status
    const updated = await db
      .update(tweetDrafts)
      .set({
        status: "posted",
        posted_at: new Date(),
        updated_at: new Date(),
      })
      .where(and(
        eq(tweetDrafts.id, params.draftId),
        eq(tweetDrafts.user_id, session.user.id)
      ))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to post tweet:", error);
    return new NextResponse("Failed to post tweet", { status: 500 });
  }
} 