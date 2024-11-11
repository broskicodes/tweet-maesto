import { db } from "@/lib/drizzle";
import { and, gte, sql } from "drizzle-orm";
import { tweets, twitterHandles } from "@/lib/db-schema";
import { Tweet, TweetEntity } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const minLikes = parseInt(searchParams.get("minLikes") || "0");
  const minViews = parseInt(searchParams.get("minViews") || "0");
  const minComments = parseInt(searchParams.get("minComments") || "0");
  const minBookmarks = parseInt(searchParams.get("minBookmarks") || "0");
  const minRetweets = parseInt(searchParams.get("minRetweets") || "0");

  try {
    const results = await db
      .select({
        tweet_id: tweets.tweet_id,
        handle_id: tweets.handle_id,
        text: tweets.text,
        date: tweets.date,
        url: tweets.url,
        view_count: tweets.view_count,
        like_count: tweets.like_count,
        reply_count: tweets.reply_count,
        retweet_count: tweets.retweet_count,
        quote_count: tweets.quote_count,
        bookmark_count: tweets.bookmark_count,
        is_reply: tweets.is_reply,
        is_retweet: tweets.is_retweet,
        is_quote: tweets.is_quote,
        is_thread: tweets.is_thread,
        language: tweets.language,
        entities: tweets.entities,
        handle: twitterHandles.handle,
        name: twitterHandles.name,
        verified: twitterHandles.verified,
        profile_image_url: twitterHandles.pfp,
        description: twitterHandles.description,
      })
      .from(tweets)
      .leftJoin(twitterHandles, sql`${tweets.handle_id} = ${twitterHandles.id}`)
      .where(
        and(
          gte(tweets.like_count, minLikes),
          gte(tweets.view_count, minViews),
          gte(tweets.reply_count, minComments),
          gte(tweets.bookmark_count, minBookmarks),
          gte(tweets.retweet_count, minRetweets),
        ),
      )
      .orderBy(
        sql`${tweets.view_count} + ${tweets.like_count} + ${tweets.reply_count} + ${tweets.bookmark_count} + ${tweets.retweet_count} DESC`,
      );

    const mappedTweets: Tweet[] = results.map((tweet) => ({
      tweet_id: tweet.tweet_id.toString(),
      text: tweet.text,
      date: tweet.date.toISOString(),
      url: tweet.url,
      view_count: tweet.view_count,
      like_count: tweet.like_count,
      reply_count: tweet.reply_count,
      retweet_count: tweet.retweet_count,
      quote_count: tweet.quote_count,
      bookmark_count: tweet.bookmark_count,
      is_reply: tweet.is_reply,
      is_retweet: tweet.is_retweet,
      is_quote: tweet.is_quote,
      is_thread: tweet.is_thread,
      language: tweet.language,
      entities: tweet.entities as TweetEntity,
      author: {
        id: tweet.handle_id.toString(),
        handle: tweet.handle!,
        name: tweet.name!,
        verified: tweet.verified!,
        url: `https://twitter.com/${tweet.handle}`,
        pfp: tweet.profile_image_url!,
        description: tweet.description || "",
      },
    }));

    return NextResponse.json(mappedTweets);
  } catch (error) {
    console.error("Error fetching popular tweets:", error);
    return NextResponse.json({ error: "Failed to fetch tweets" }, { status: 500 });
  }
}
