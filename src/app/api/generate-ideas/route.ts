import { NextResponse } from "next/server"
import { z } from "zod"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod.mjs"
import { db } from "@/lib/drizzle"
import { freeloaders, twitterHandles } from "@/lib/db-schema"
import { eq } from "drizzle-orm"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerateIdeasRequest {
    twitterHandle: string
    targetAudience: string
    additionalInfo?: string
  }

const TweetIdeaSchema = z.object({
  topic: z.string().describe("The topic of the tweet"),
  type: z.string().describe("The type of the tweet, e.g. 'Thread', 'Story', 'Meme'"),
  description: z.string().describe("A short description of the tweet"),
  hooks: z.array(z.string()).describe("A list of possible engaging hooks for the tweet"),
  structure: z.string().describe("The structure of the tweet"),
  reward: z.string().describe("The reward/value for the reader"),
})

const ResponseSchema = z.object({
  ideas: z.array(TweetIdeaSchema),
})

export async function POST(req: Request) {
  try {
    const body = await req.json() as GenerateIdeasRequest

    // const res = await fetch(`${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/users/import`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ handles: [body.twitterHandle] }),
    // })

    // const data = await res.json()
    // const user = data.users
    // console.log(user)

    const existingHandle = await db.query.twitterHandles.findFirst({
      where: eq(twitterHandles.handle, body.twitterHandle),
    })

    if (!existingHandle) {
      await db.insert(freeloaders).values({
        handle: body.twitterHandle,
      }).onConflictDoNothing();
    }

    const prompt = `Generate 3 tweet ideas for a Twitter user with the following details:
    Twitter Handle: ${body.twitterHandle}
    Target Audience: ${body.targetAudience}
    ${body.additionalInfo ? `Additional Context: ${body.additionalInfo}` : ''}

    For each idea, provide:
    - A topic. This should be a single sentence. Max 5 words.
    - A short description of the tweet. This should be a single sentence explaining the idea of the tweet in more detail.
    - Type. This should be a single word, e.g. 'Demo', 'Thread', 'Story', 'Meme', etc.
    - A list of possible engaging hooks for the topic. Each hook should be a single sentence.
    - Tweet structure. Give a detailed description of how to structure the tweet. Include a numbered markdown list of the important tweet elements separated by a new line.
    - The ideal reward/value that the reader should receive from the tweet. This should be a single sentence.
    
    Never include hashtags or emojis in your response.`

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: zodResponseFormat(ResponseSchema, "ideas"),
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error("No content in response")

    const rawResponse = JSON.parse(content)
    const response = ResponseSchema.parse(rawResponse)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating ideas:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    )
  }
} 