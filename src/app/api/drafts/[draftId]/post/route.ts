import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTwitterClient } from "../../twitterClient";
import { TweetBox } from "@/store/drafts";
import client, { EUploadMimeType, TwitterApi } from "twitter-api-v2";
import { join } from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws";

type MediaIds =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string];

export async function POST(req: Request, { params }: { params: { draftId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Get the draft
    const draft = await db.query.tweetDrafts.findFirst({
      where: and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)),
    });

    if (!draft) {
      return new NextResponse("Draft not found", { status: 404 });
    }

    const twitterClient = await createTwitterClient(session.user.id);
    const tweetBoxes = draft.tweet_boxes as TweetBox[];

    // 2. Process each tweet box and upload media if present
    const processedTweets = await Promise.all(
      tweetBoxes.map(async (tweetBox) => {
        if (!tweetBox.media?.length) {
          return { text: tweetBox.content };
        }

        // Upload each media item and get media IDs
        const mediaIds = await Promise.all(
          tweetBox.media.slice(0, 4).map(async (mediaItem) => {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: mediaItem.s3Key,
            });

            const file = await s3Client.send(command);

            const buffer = await file.Body?.transformToByteArray();

            if (!buffer) {
              throw new Error("No buffer");
            }

            try {
              const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(buffer), {
                mimeType: file.ContentType,
                target: "tweet",
                shared: false,
              });

              return mediaId;
            } catch (error) {
              // Log the detailed error
              console.error("Twitter media upload failed:", {
                error,
                fileType: file.ContentType,
                fileSize: file.ContentLength,
              });
              throw error;
            }
          }),
        );

        return {
          text: tweetBox.content,
          media: { media_ids: mediaIds as MediaIds },
        };
      }),
    );

    // 3. Post the thread with media
    await twitterClient.v2.tweetThread(processedTweets);

    // 4. Update draft status
    const updated = await db
      .update(tweetDrafts)
      .set({
        status: "posted",
        posted_at: new Date(),
        updated_at: new Date(),
      })
      .where(and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to post tweet:", error);
    return new NextResponse(error instanceof Error ? error.message : "Failed to post tweet", {
      status: 500,
    });
  }
}
