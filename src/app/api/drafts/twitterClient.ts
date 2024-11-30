import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { users } from "@/lib/db-schema";
import { TwitterApi } from "twitter-api-v2";

export async function createTwitterClient(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.oauth_token) {
    throw new Error("No Twitter access token found");
  }

  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET_KEY!,
    accessToken: user.oauth_token!,
    accessSecret: user.oauth_token_secret!,
  });
}
