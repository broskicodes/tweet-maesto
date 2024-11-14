import { tweets, twitterFollowers, twitterHandles, chats, chatMessages } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { ChatPromptType } from "@/lib/types";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPTS: Record<ChatPromptType, string> = {
  [ChatPromptType.AudienceInitialize]: 
    `You are a Twitter account manager and growth expert. You excel at creating digital personas and defining target audiences for clients.

<client>
{client}
</client>

<tweets>
{tweets}
</tweets>

You are currenly onboarding a new client. Information about the client is provided above in <client> tags.

Your task is to ask the client questions one at a time and deduce their ideal digital persona and target audience. You may ask up to 3 questions to the client.

Use the informatcion provided about them as well as their past tweets in <tweet> tags to formulate insightful questions. Keep your responses short, friendly and informal.`,
};

export async function POST(req: Request) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user) {
//     return new Response("Unauthorized", { status: 401 });
//   }

  try {
    const { messages, type, handle } = await req.json();

    if (!messages || !type || !handle) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (!Object.values(ChatPromptType).includes(type)) {
      return new Response("Invalid chat type", { status: 400 });
    }

    const [handleRecord] = await db
        .select({
            name: twitterHandles.name,
            description: twitterHandles.description,
            verified: twitterHandles.verified,
            id: twitterHandles.id,
        })
        .from(twitterHandles)
        .where(eq(twitterHandles.handle, handle))
        .limit(1);

    const [{ followers }] = await db
        .select({ followers: twitterFollowers.followers })
        .from(twitterFollowers)
        .where(eq(twitterFollowers.handle_id, handleRecord.id))
        .orderBy(desc(twitterFollowers.created_at))
        .limit(1);

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
        .where(and(eq(tweets.handle_id, handleRecord.id), gte(tweets.date, new Date("2024-10-01"))))
        .orderBy(desc(tweets.date))
        .limit(20);

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPTS[type as ChatPromptType]
        .replace("{client}", JSON.stringify({
            name: handleRecord.name,
            description: handleRecord.description,
            verified: handleRecord.verified,
            followers: followers,
        }))
        .replace("{tweets}", userTweets.map((tweet, index) => `    <tweet_${index}>
        text: "${tweet.text}"
        date: "${tweet.date}"
        views: ${tweet.view_count}
    </tweet_${index}>`).join("\n"))
    };

    console.log(systemMessage.content);

    // Create or get existing chat
    // let [chatRecord] = await db
    //   .select()
    //   .from(chats)
    //   .where(and(
    //     eq(chats.user_id, session.user.id),
    //     eq(chats.type, type),
    //     isNull(chats.deleted_at)
    //   ))
    //   .limit(1);

    // if (!chatRecord) {
    //   const [newChat] = await db
    //     .insert(chats)
    //     .values({
    //       user_id: session.user.id,
    //       type,
    //     })
    //     .returning();
    //   chatRecord = newChat;
    // }

    // // Store the new message
    // if (messages.length > 0) {
    //   const lastMessage = messages[messages.length - 1];
    //   await db.insert(chatMessages).values({
    //     chat_id: chatRecord.id,
    //     role: lastMessage.role,
    //     content: lastMessage.content,
    //   });
    // }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [systemMessage, ...messages],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let aiResponse = '';
        
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          aiResponse += content;
          controller.enqueue(content);
        }

        // Store AI response
        // await db.insert(chatMessages).values({
        //   chat_id: chatRecord.id,
        //   role: 'assistant',
        //   content: aiResponse,
        // });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
} 