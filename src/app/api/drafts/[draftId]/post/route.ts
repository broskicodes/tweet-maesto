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

type MediaIds = [string] | [string, string] | [string, string, string] | [string, string, string, string];

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

    const uploadClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET_KEY!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!
    });
    const twitterClient = await createTwitterClient(session.user.id);
    const tweetBoxes = draft.tweet_boxes as TweetBox[];

    // 2. Process each tweet box and upload media if present
    const processedTweets = await Promise.all(tweetBoxes.map(async (tweetBox) => {
      if (!tweetBox.media?.length) {
        return { text: tweetBox.content };
      }

      // Upload each media item and get media IDs
      const mediaIds = await Promise.all(
        tweetBox.media.slice(0, 4).map(async (mediaItem) => {
          const formData = await req.formData();
          const file = formData.get(`file-${mediaItem.id}`) as File;
          if (!file) throw new Error(`Media file ${mediaItem.id} not found`);
          
          const buffer = await file.arrayBuffer();
          
          try {
            // Log the file details for debugging
            // console.log('Uploading media:', {
            //   type: file.type,
            //   size: file.size,
            //   name: file.name
            // });
            
            const mediaId = await uploadClient.v1.uploadMedia(
              Buffer.from(buffer),
              { 
                mimeType: file.type,
                target: 'tweet',
                shared: false
              }
            );
            
            return mediaId;
          } catch (error) {
            // Log the detailed error
            console.error('Twitter media upload failed:', {
              error,
              fileType: file.type,
              fileSize: file.size
            });
            throw error;
          }
        })
      );

      return {
        text: tweetBox.content,
        media: { media_ids: mediaIds as MediaIds }
      };
    }));

    console.log(processedTweets[0].media?.media_ids[0]);
    // const info = await uploadClient.v1.mediaInfo(processedTweets[0].media?.media_ids[0]!);
    // console.log(JSON.stringify(info, null, 2));
    
    // 3. Post the thread with media
    await uploadClient.v2.tweetThread(processedTweets);

    // 4. Update draft status
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
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to post tweet", 
      { status: 500 }
    );
  }
} 