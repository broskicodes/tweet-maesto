import { NextResponse } from 'next/server';
import { createTwitterClient } from '../../drafts/twitterClient';
import { authOptions } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import { TwitterApi } from 'twitter-api-v2';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const twitterUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id)
    });

    if (!twitterUser) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    const twitterUserId = twitterUser.twitter_handle_id.toString();
    const twitterClient = await createTwitterClient(session.user.id);
    // const twitterClient = new TwitterApi({
    //     appKey: process.env.TWITTER_API_KEY!,
    //     appSecret: process.env.TWITTER_API_SECRET_KEY!,
    //     accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    //     accessSecret: process.env.TWITTER_ACCESS_SECRET!
    // });

    const likers = await twitterClient.v2.tweetLikedBy("1858542909017973016");
    console.log(likers.data.map(l => l.username));
   
    // const followers = await twitterClient.v2.following(twitterUserId, {
    //   max_results: 100
    // });
    // console.log(followers);

    // const likedTweets = await twitterClient.v2.userLikedTweets(twitterUserId, {
    //   max_results: 5
    // });
    // console.log(likedTweets);

    // for (const tweet of likedTweets.tweets) {
    //   console.log(tweet);
    // }
    

    return NextResponse.json({ users: likers.data.map(l => l.username) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
} 