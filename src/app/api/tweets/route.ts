import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { tweets, twitterHandles } from "@/lib/db-schema";
import { eq } from "drizzle-orm";
import { LeaderboardData, Tweet, TweetEntity } from "@/lib/types";

export async function GET(request: Request) {
  try {
    // Fetch all unique handles with their data
    const handles = await db
      .select({
        user_id: twitterHandles.id,
        handle: twitterHandles.handle,
        url: twitterHandles.url,
        pfp: twitterHandles.pfp,
      })
      .from(twitterHandles)
      .limit(100);

    // Fetch tweets for all handles concurrently
    const tweetPromises = handles.map(async ({ user_id, handle, url, pfp }) => {
      const tweetData = await db
        .select({
          date: tweets.date,
          url: tweets.url,
          text: tweets.text,
          tweet_id: tweets.tweet_id,
          bookmark_count: tweets.bookmark_count,
          retweet_count: tweets.retweet_count,
          reply_count: tweets.reply_count,
          like_count: tweets.like_count,
          quote_count: tweets.quote_count,
          view_count: tweets.view_count,
          language: tweets.language,
          is_reply: tweets.is_reply,
          is_retweet: tweets.is_retweet,
          is_quote: tweets.is_quote,
          is_thread: tweets.is_thread,
          entities: tweets.entities,
        })
        .from(tweets)
        .innerJoin(twitterHandles, eq(tweets.handle_id, twitterHandles.id))
        .where(eq(twitterHandles.handle, handle))
        .orderBy(tweets.date)
        .limit(100);

      return {
        handle,
        data: {
          user_id: user_id.toString(),
          url,
          pfp,
          tweets: tweetData.map((tweet) => ({
            ...tweet,
            entities: tweet.entities as TweetEntity,
            tweet_id: tweet.tweet_id.toString(),
            date: tweet.date.toISOString(),
          })),
        },
      };
    });

    const results = await Promise.all(tweetPromises);
    const tweetsByHandle = Object.fromEntries(
      results.map(({ handle, data }) => [handle, data])
    );

    return NextResponse.json(tweetsByHandle);
  } catch (error) {
    console.error("Error fetching all tweets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
