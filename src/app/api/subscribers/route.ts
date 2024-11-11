import { subscriptions } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const subs = await db.select().from(subscriptions);

  return NextResponse.json(subs);
}
