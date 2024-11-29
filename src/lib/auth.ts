import { AuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { db } from "@/lib/drizzle";
import { users, twitterHandles, subscriptions } from "@/lib/db-schema";
import { and, eq } from "drizzle-orm";

export const authOptions: AuthOptions = {
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
            verified: twitterHandles.verified,
          })
          .from(twitterHandles)
          .where(eq(twitterHandles.id, BigInt(userId)))
          .limit(1);

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
          const [userSubscription] = await db
            .select({
              id: subscriptions.id,
              type: subscriptions.type,
              active: subscriptions.active,
            })
            .from(subscriptions)
            .where(and(eq(subscriptions.user_id, dbUser.id), eq(subscriptions.active, true)))
            .limit(1);

          return {
            ...session,
            user: {
              ...session.user,
              id: dbUser.id,
              handle: twitterHandle.handle,
              verified: twitterHandle.verified,
              subscribed: userSubscription?.active || false,
              onboarded: dbUser.onboarded,
            },
          };
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
  },
};
