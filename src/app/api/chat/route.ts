import { tweets, twitterFollowers, twitterHandles, chats, chatMessages, profiles, users } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { ChatPromptType } from "@/lib/types";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { analysisSchema } from "../profiles/route";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPTS: Record<ChatPromptType, string> = {
  [ChatPromptType.AudienceInitializeChat]: 
    `You are a Twitter account manager and growth expert. You excel at creating digital personas and defining target audiences for clients.

<client>
{client}
</client>

<tweets>
{tweets}
</tweets>

You are currenly onboarding a new client. Information about the client is provided above in <client> tags.

Your task is to ask the client questions one at a time and deduce their ideal digital persona and target audience. You may ask up to 3 questions to the client.

Use the informatcion provided about them as well as their past tweets in <tweet> tags to formulate insightful questions. Keep your responses short, friendly and informal.

Each response you generate will be output in 2 parts:
1. The response to the user. Provide this in <response> tags.
2. Whether the interaction is complete. Specify "True" or "False" in <complete> tags.

In your last response, thank the user for their answers and inform them that you are now generating their persona.`,

    [ChatPromptType.AudienceInitialize]: 
    `You are a Twitter account manager and growth expert. You excel at creating digital personas and defining target audiences for clients.

<client>
{client}
</client>

<tweets>
{tweets}
</tweets>

<conversation>
{conversation}
</conversation>

You have just finished the onboarding conversation with the client. The conversation is provided above in <conversation> tags.

You can also find information about the client's twitter account is <client> tags and their tweets in <tweets> tags.

Using the provided information, your task is to output a JSON object with the following fields:
- persona: A description of the user's persona based on their profile information and tweets. 1 sentence.
- target_audience: An estimate of the user's target audience given their description and what they tweet about. 1 sentence.
- content_pillars: A list of 2-4 key topics the user centers their tweets around. Pay special attention to the tweets that get the most engagement (views, likes, replies, etc.).`,
};

export async function POST(req: Request) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user) {
//     return new Response("Unauthorized", { status: 401 });
//   }

  try {
    const { messages, type, user: { handle, id: userId }, chatId } = await req.json();

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

    switch (type) {
      case ChatPromptType.AudienceInitializeChat:{

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

      // Create or get existing chat
      const [chatRecord] = await db
        .insert(chats)
        .values({
          id: chatId,
          user_id: userId,
          type,
        })
        .onConflictDoNothing()
        .returning();

      // Store the new message
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        await db.insert(chatMessages).values({
          chat_id: chatId,
          role: lastMessage.role,
          content: lastMessage.content,
        });
      }

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
            await db.insert(chatMessages).values({
              chat_id: chatId,
              role: 'assistant',
              content: aiResponse,
            });

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
      }

      case ChatPromptType.AudienceInitialize: {
        const systemMessage = {
          role: "system",
          content: SYSTEM_PROMPTS[type as ChatPromptType]
            .replace("{conversation}", messages.map((message: { role: string; content: string }) => `    <message>
        role: "${message.role}"
        content: "${message.content.match(/<response>([^]*?)<\/response>/)?.[1]?.trim() || message.content}"
    </message>`).join("\n"))
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

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemMessage.content }],
          response_format: zodResponseFormat(analysisSchema, "analysis"),
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content in response");

        const rawAnalysis = JSON.parse(content);
        const analysis = analysisSchema.parse(rawAnalysis);

        console.log(analysis);

        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: analysis.target_audience,
          dimensions: 384,
        });

        // Store profile with embeddings
        await db
        .insert(profiles)
        .values({
          handle_id: handleRecord.id,
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

        await db.update(users).set({
          onboarded: true,
        }).where(eq(users.id, userId));

        return new Response(JSON.stringify({ analysis }), { status: 200 });
      }
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
} 