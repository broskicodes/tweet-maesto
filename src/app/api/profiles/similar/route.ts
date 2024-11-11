import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { profiles, twitterHandles, twitterFollowers } from "@/lib/db-schema";
import { cosineDistance, desc, eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { handle, page = 0 } = await request.json();
    const offset = page * 5;

    if (!handle) {
      return NextResponse.json({ error: "Handle required" }, { status: 400 });
    }

    // First get the handle_id
    const handleRecord = await db
      .select({ id: twitterHandles.id })
      .from(twitterHandles)
      .where(eq(twitterHandles.handle, handle))
      .limit(1);

    if (!handleRecord.length) {
      return NextResponse.json({ error: "Handle not found" }, { status: 404 });
    }

    // Get the profile's embedding
    const profile = await db
      .select({ embedding: profiles.embedding })
      .from(profiles)
      .where(eq(profiles.handle_id, handleRecord[0].id))
      .limit(1);

    if (!profile.length || !profile[0].embedding) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Find similar profiles using cosine similarity and include latest follower count
    const similarProfiles = await db
      .select({
        handle: twitterHandles.handle,
        name: twitterHandles.name,
        description: twitterHandles.description,
        content_pillars: profiles.content_pillars,
        target_audience: profiles.target_audience,
        pfp: twitterHandles.pfp,
        followers: sql<number>`(
          SELECT followers 
          FROM ${twitterFollowers} tf 
          WHERE tf.handle_id = ${twitterHandles.id}
          ORDER BY tf.created_at DESC 
          LIMIT 1
        )`,
        similarity: sql<number>`1 - (${cosineDistance(profiles.embedding, profile[0].embedding)})`
      })
      .from(profiles)
      .innerJoin(twitterHandles, eq(profiles.handle_id, twitterHandles.id))
      .where(sql`${profiles.handle_id} != ${handleRecord[0].id}`)
      .orderBy((t) => desc(t.similarity))
      .limit(5)
      .offset(offset);

    return NextResponse.json(similarProfiles.map(profile => ({
      ...profile,
      pfp: `https://unavatar.io/twitter/${profile.handle}`,
      followers: profile.followers || 0
    })));
  } catch (error) {
    console.error("Error finding similar profiles:", error);
    return NextResponse.json(
      { error: "Failed to find similar profiles" },
      { status: 500 }
    );
  }
} 