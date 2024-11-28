import { db } from "@/lib/drizzle";
import { tweetDrafts } from "@/lib/db-schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { draftId: string } }) {
  const session = await getServerSession(authOptions);
  const { tweet_boxes } = await req.json();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const updated = await db
    .update(tweetDrafts)
    .set({
      tweet_boxes,
      updated_at: new Date(),
    })
    .where(and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)))
    .returning();

  if (!updated.length) {
    return new NextResponse("Draft not found", { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(req: Request, { params }: { params: { draftId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const deleted = await db
    .update(tweetDrafts)
    .set({
      deleted_at: new Date(),
    })
    .where(and(eq(tweetDrafts.id, params.draftId), eq(tweetDrafts.user_id, session.user.id)))
    .returning();

  if (!deleted.length) {
    return new NextResponse("Draft not found", { status: 404 });
  }

  return NextResponse.json(deleted[0]);
}
