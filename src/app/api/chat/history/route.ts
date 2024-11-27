import { db } from "@/lib/drizzle";
import { chats, chatMessages, twitterHandles } from "@/lib/db-schema";
import { and, eq, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  //   const session = await getServerSession(authOptions);
  //   if (!session?.user) {
  //     return new Response("Unauthorized", { status: 401 });
  //   }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type) {
    return new Response("Missing required parameters", { status: 400 });
  }

  try {
    // const [chatRecord] = await db
    //   .select()
    //   .from(chats)
    //   .where(and(
    //     eq(chats.user_id, session.user.id),
    //     eq(chats.type, type),
    //     isNull(chats.deleted_at)
    //   ))
    //   .limit(1);
    // if (!chatRecord) {
    //   return new Response(JSON.stringify({ messages: [] }), {
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    // const messages = await db
    //   .select()
    //   .from(chatMessages)
    //   .where(eq(chatMessages.chat_id, chatRecord.id))
    //   .orderBy(chatMessages.created_at);
    // return new Response(JSON.stringify({
    //   messages: messages.map(msg => ({
    //     id: msg.id,
    //     role: msg.role,
    //     content: msg.content,
    //   }))
    // }), {
    //   headers: { "Content-Type": "application/json" },
    // });
  } catch (error) {
    console.error("Chat history error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
