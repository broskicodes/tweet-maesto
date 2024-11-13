import { ChatPromptType } from "@/lib/types";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPTS: Record<ChatPromptType, string> = {
  [ChatPromptType.AudienceInitialize]: 
    "You are helping define a Twitter account's target audience. Be specific and concise. Focus on demographics, interests, and pain points.",
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

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPTS[type as ChatPromptType],
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          console.log(content);
          controller.enqueue(content);
        }
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