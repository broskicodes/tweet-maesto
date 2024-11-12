import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { tweets, twitterHandles, twitterFollowers, profiles, users, subscriptions } from "@/lib/db-schema";
import { and, desc, eq, gte, not, isNull } from "drizzle-orm";
import { TweetEntity } from "@/lib/types";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define response schema
const analysisSchema = z.object({
  persona: z
    .string()
    .describe("A description of the user's persona based on their profile and tweets"),
  target_audience: z
    .string()
    .describe("The user's target audience based on content and engagement"),
  content_pillars: z
    .array(z.string())
    .describe("Key topics the user tweets about, focusing on high-engagement content"),
});

export async function POST(request: NextRequest) {
  try {
    const { handle, all } = await request.json();

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

    // Get handle info
    let handleRecord: {
      id: bigint;
      description: string | null;
      name: string;
      verified: boolean;
      url: string;
    }[];

    if (all) {
      handleRecord = await db
        .select({
          id: twitterHandles.id,
          description: twitterHandles.description,
          name: twitterHandles.name,
          verified: twitterHandles.verified,
          url: twitterHandles.url,
        })
        .from(twitterHandles)
        .innerJoin(users, eq(users.twitter_handle_id, twitterHandles.id))
        .innerJoin(subscriptions, eq(subscriptions.user_id, users.id))
        .leftJoin(profiles, eq(profiles.handle_id, twitterHandles.id))
        .where(and(
          eq(subscriptions.active, true),
          isNull(profiles.handle_id)
        ));
    } else {
      handleRecord = await db
        .select({
          id: twitterHandles.id,
          description: twitterHandles.description,
          name: twitterHandles.name,
          verified: twitterHandles.verified,
          url: twitterHandles.url,
        })
        .from(twitterHandles)
        .where(eq(twitterHandles.handle, handle));
    }

    // const founderKeywords = [
    //   "build",        "indie hacker", "founder",      "entrepreneur",
    //   "startup",      "maker",        "ceo",          "bootstrap",
    //   "launched",     "shipping",     "created",      "mrr",
    //   "built",        "market",       "prev",         "product",
    //   "pricing",      "launch",       "ai",           "ml",
    //   "code",         "user",         "growth",       "dev",
    //   "customer",     "product",      "VP",           "sell",
    //   "sales",        "engineer",     "swe",          "pm",
    //   "design",       "ux",           "ui",           "software",
    //   "business",     "computer",     "content",      "community",
    //   "tool",         "tech",         "data",         "science",
    //   "analytics",    "money",        "eng",          "github",
    //   "blog",         "youtube"       
    // ];

    // const otherKeywords = [
    //   "write",        
    //   "book", 
    //   "ship", 
    //   "work"
    // ];
    // const politicsKeywords = [
    //   "president",
    //   "democrat",
    // ];

    // const ok = [
    //   "https://x.com/CtrlAltDwayne",
    //   "https://x.com/admiralrohan",
    //   "https://x.com/postmarkapp",
    //   "https://x.com/RichardHanania",
    //   "https://x.com/gdb",
    //   "https://x.com/KatColeATL",
    //   "https://x.com/emollick",
    //   "https://x.com/AndrewRousso"
    // ];
    // Get follower counts and filter handles
    const handleWithFollowers = await Promise.all(
      handleRecord
        // .filter(
        //   (handle) =>
        //     handle.description &&
        //     !founderKeywords.some((keyword) =>
        //       handle.description?.toLowerCase().includes(keyword.toLowerCase()),
        //     )
        //     &&
        //     !ok.includes(handle.url)
        //     &&
        //     !otherKeywords.some((keyword) =>
        //       handle.description?.toLowerCase().includes(keyword.toLowerCase()),
        //     )
        //     // politicsKeywords.some((keyword) =>
        //     //   handle.description?.toLowerCase().includes(keyword.toLowerCase()),
        //     // ),
        // )
        .map(async (handle) => {
          const followerCount = await db
            .select({ followers: twitterFollowers.followers })
            .from(twitterFollowers)
            .where(eq(twitterFollowers.handle_id, handle.id))
            .orderBy(desc(twitterFollowers.created_at))
            .limit(1);

          return {
            ...handle,
            followers: followerCount[0]?.followers ?? 0,
          };
        })
    );

    
    // await Promise.all(
    //   handleWithFollowers.filter((handle) => handle.followers < 10000)
    //     .map(async (handle) => {
    //       await db.delete(tweets).where(eq(tweets.handle_id, handle.id));
    //       await db.delete(twitterFollowers).where(eq(twitterFollowers.handle_id, handle.id));
    //       await db.delete(twitterHandles).where(eq(twitterHandles.id, handle.id));
    //     })
    // );

    console.log(handleWithFollowers.map((handle) => handle.url));
    console.log(handleWithFollowers[0]);
    // Filter for handles with >1000 followers
    const filteredHandles = handleWithFollowers
      // .filter((handle) => handle.followers > 1000 && handle.followers < 1000000)
      // .sort((a, b) => b.followers - a.followers);

    // return NextResponse.json({
    //   ok: true
    // });

    const batchSize = 10;
    const startIndex = 0; // Skip first 10
    const endIndex = 100; // Process up to 100

    for (let i = startIndex; i < Math.min(filteredHandles.length, endIndex); i += batchSize) {
      const batch = filteredHandles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (handle) => {
          const userTweets = await db
            .select({
              tweet_id: tweets.tweet_id,
              text: tweets.text,
              date: tweets.date,
              entities: tweets.entities,
              view_count: tweets.view_count,
              like_count: tweets.like_count,
              reply_count: tweets.reply_count,
              retweet_count: tweets.retweet_count,
              quote_count: tweets.quote_count,
              bookmark_count: tweets.bookmark_count,
              is_thread: tweets.is_thread,
            })
            .from(tweets)
            .where(and(eq(tweets.handle_id, handle.id), gte(tweets.date, new Date("2024-10-01"))))
            .orderBy(desc(tweets.date));

          const prompt = `You are a social media marketing expert. You specialize in analyzing Twitter users and their tweets to provide insights on their marketing and growth strategy.

<user>
    name: ${handle.name}
    description: ${handle.description}
    verified: ${handle.verified}
    followers: ${handle.followers}
</user>

<tweets>
    ${userTweets
      .map(
        (tweet, index) => `    <tweet_${index}>
        text: "${tweet.text}"
        date: ${tweet.date}
        views: ${tweet.view_count}
        likes: ${tweet.like_count}
        replies: ${tweet.reply_count}
        retweets: ${tweet.retweet_count + tweet.quote_count}
        bookmarks: ${tweet.bookmark_count}
        is_thread: ${tweet.is_thread}
    </tweet_${index}>`,
      )
      .join("\n")}
</tweets>

Above you are given information about the user's profile in <user> and their tweets in <tweets>.

Your task is to output a JSON object with the following fields:
- persona: A description of the user's persona based on their profile information and tweets. 1 sentence.
- target_audience: An estimate of the user's target audience given their description and what they tweet about. 1 sentence.
- content_pillars: A list of 2-4 key topics the user centers their tweets around. Pay special attention to the tweets that get the most engagement (views, likes, replies, etc.).`;

          const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-4o-mini",
            response_format: zodResponseFormat(analysisSchema, "analysis"),
          });

          const content = completion.choices[0].message.content;
          if (!content) throw new Error("No content in response");

          const rawAnalysis = JSON.parse(content);
          const analysis = analysisSchema.parse(rawAnalysis);

          //   console.log(analysis);

          // Get embeddings for the analysis
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: `${analysis.persona} target audience: ${analysis.target_audience}`,
            dimensions: 384,
          });

          // Store profile with embeddings
          await db
            .insert(profiles)
            .values({
              handle_id: handle.id,
              persona: analysis.persona,
              target_audience: analysis.target_audience,
              content_pillars: analysis.content_pillars,
              embedding: embeddingResponse.data[0].embedding,
            })
            .onConflictDoUpdate({
              target: profiles.handle_id,
              set: {
                persona: analysis.persona,
                target_audience: analysis.target_audience,
                content_pillars: analysis.content_pillars,
                embedding: embeddingResponse.data[0].embedding,
                updated_at: new Date(),
              },
            });

          console.log(`Processed handle: ${handle.name}`);
        }),
      );

      console.log(
        `Completed batch ${i / batchSize + 1} of ${Math.ceil((endIndex - startIndex) / batchSize)}`,
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid AI response format", details: error.errors },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
