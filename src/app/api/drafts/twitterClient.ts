import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { users } from "@/lib/db-schema";
import { TwitterApi } from "twitter-api-v2";

export async function createTwitterClient(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (
    user?.access_token_expires_at &&
    user.twitter_refresh_token &&
    new Date() >= user.access_token_expires_at
  ) {
    // Create client with refresh token
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    });

    // Refresh the token
    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn, // seconds
    } = await client.refreshOAuth2Token(user.twitter_refresh_token);

    // Save new tokens
    await db.update(users).set({
      twitter_access_token: newAccessToken,
      twitter_refresh_token: newRefreshToken,
      access_token_expires_at: new Date(Date.now() + expiresIn * 1000),
    });

    return new TwitterApi(newAccessToken);
  }

  if (!user?.twitter_access_token) {
    throw new Error("No Twitter access token found");
  }

  return new TwitterApi(user.twitter_access_token);
}
