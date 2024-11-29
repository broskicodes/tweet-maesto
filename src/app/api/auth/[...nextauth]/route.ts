import { users, twitterHandles, subscriptions } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { TwitterScrapeType } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PostHog } from "posthog-node";

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 1000,
});

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_API_SECRET_KEY!,
      version: "1.0",
      authorization: {
        params: {
          scope: "read write",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const userId = token.userId as string;

        const [twitterHandle] = await db
          .select({
            handle: twitterHandles.handle,
            verified: twitterHandles.verified,
          })
          .from(twitterHandles)
          .where(eq(twitterHandles.id, BigInt(userId)))
          .limit(1);

        // Find the user by their Twitter handle ID
        const [dbUser] = await db
          .select({
            id: users.id,
            twitter_handle_id: users.twitter_handle_id,
            onboarded: users.onboarded,
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
          session.user.verified = twitterHandle.verified;
          // @ts-ignore
          session.user.subscribed = userSubscription?.active || false;
          // @ts-ignore
          session.user.onboarded = dbUser.onboarded;
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

      const profileData = (profile as any);

      if (user && user.id && profileData) {
        try {
          // Upsert the Twitter handle
          const [upsertedHandle] = await db
            .insert(twitterHandles)
            .values({
              id: BigInt(user.id),
              handle: profileData.screen_name as string,
              name: profileData.name as string,
              description: profileData.description as string,
              url: `https://x.com/${profileData.screen_name}`,
              pfp: profileData.profile_image_url as string,
            })
            .onConflictDoUpdate({
              target: twitterHandles.id,
              set: {
                handle: profileData.screen_name as string,
                name: profileData.name as string,
                description: profileData.description as string,
                url: `https://x.com/${profileData.screen_name}`,
                pfp: profileData.profile_image_url as string,
                updated_at: new Date(),
              },
            })
            .returning({ id: twitterHandles.id });

          const twitterHandleId = upsertedHandle.id;
          console.log(`Twitter handle ${profileData.screen_name} upserted with ID:`, twitterHandleId);

          // Upsert the user
          const [{ id: upsertedUserId, created_at: createdAt }] = await db
            .insert(users)
            .values({
              name: user.name || "",
              email: user.email || "",
              twitter_handle_id: twitterHandleId,
              oauth_token: account?.oauth_token as string,
              oauth_token_secret: account?.oauth_token_secret as string,
            })
            .onConflictDoUpdate({
              target: users.twitter_handle_id,
              set: {
                name: user.name || "",
                email: user.email || "",
                oauth_token: account?.oauth_token as string,
                oauth_token_secret: account?.oauth_token_secret as string,
                updated_at: new Date(),
              },
            })
            .returning({ id: users.id, created_at: users.created_at });

          console.log(`User upserted with ID:`, upsertedUserId);

          posthog.identify({
            distinctId: upsertedUserId,
            properties: {
              handle: profileData.screen_name,
            },
          });

          posthog.capture({
            distinctId: user.id,
            event: "sign-in-success",
          });

          posthog.shutdown();
          // Check if this is a new user
          if (createdAt && new Date().getTime() - createdAt.getTime() <= 30000) {
            console.log("Initializing Twitter handle:", profileData.screen_name);
            const jobResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/scrape`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  scrapeType: TwitterScrapeType.Initialize,
                  handles: [profileData.screen_name],
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
