import { users, twitterHandles, subscriptions } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { TwitterScrapeType } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const userId = token.userId as string;

        const [twitterHandle] = await db
          .select({
            handle: twitterHandles.handle,
          })
          .from(twitterHandles)
          .where(eq(twitterHandles.id, BigInt(userId)))
          .limit(1);

        // Find the user by their Twitter handle ID
        const [dbUser] = await db
          .select({
            id: users.id,
            twitter_handle_id: users.twitter_handle_id,
          })
          .from(users)
          .where(eq(users.twitter_handle_id, BigInt(userId)))
          .limit(1);

        if (dbUser) {
          // Check for active subscription
          const [userSubscription] = await db
            .select({
              id: subscriptions.id,
              type: subscriptions.type,
              active: subscriptions.active,
            })
            .from(subscriptions)
            .where(and(eq(subscriptions.user_id, dbUser.id), eq(subscriptions.active, true)))
            .limit(1);

          // @ts-ignore
          session.user.id = dbUser.id;
          // @ts-ignore
          session.user.handle = twitterHandle.handle;
          // @ts-ignore
          session.user.subscribed = userSubscription?.active || false;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      return token;
    },
    async signIn({ user, account, profile }) {
      console.log("signIn", user, account, profile);

      const profileData = (profile as any).data;

      if (user && user.id && profileData) {
        try {
          // Upsert the Twitter handle
          const [upsertedHandle] = await db
            .insert(twitterHandles)
            .values({
              id: BigInt(user.id),
              handle: profileData.username as string,
              url: `https://x.com/${profileData.username}`,
              pfp: profileData.profile_image_url as string,
            })
            .onConflictDoUpdate({
              target: twitterHandles.handle,
              set: {
                handle: profileData.username as string,
                url: `https://x.com/${profileData.username}`,
                updated_at: new Date(),
              },
            })
            .returning({ id: twitterHandles.id });

          const twitterHandleId = upsertedHandle.id;
          console.log(`Twitter handle ${profileData.username} upserted with ID:`, twitterHandleId);

          // Upsert the user
          const [{ id: upsertedUserId, created_at: createdAt }] = await db
            .insert(users)
            .values({
              name: user.name || "",
              email: user.email || "",
              twitter_handle_id: twitterHandleId,
            })
            .onConflictDoUpdate({
              target: users.twitter_handle_id,
              set: {
                name: user.name || "",
                updated_at: new Date(),
              },
            })
            .returning({ id: users.id, created_at: users.created_at });

          console.log(`User upserted with ID:`, upsertedUserId);

          // Check if this is a new user
          if (createdAt && new Date().getTime() - createdAt.getTime() <= 30000) {
            console.log("Initializing Twitter handle:", profileData.username);
            const jobResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SCRAPER_URL}/scrape/twitter`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  scrapeType: TwitterScrapeType.Initialize,
                  handles: [profileData.username],
                }),
              },
            );

            // const { jobId } = await jobResponse.json();
            // console.log("Job ID:", jobId);
          } else {
            console.log("Existing user updated:", upsertedUserId);
          }

          return true; // Sign in successful
        } catch (error) {
          console.error("Unexpected error during sign in:", error);
          return false; // Prevent sign in on unexpected errors
        }
      }

      return false; // Prevent sign in if user or profile is missing
    },
  },
});

export { handler as GET, handler as POST };
