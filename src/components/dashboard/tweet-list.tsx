import { Tweet } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  Bookmark,
  BarChart2,
  ExternalLink,
  MessageCircle,
  Quote,
  Repeat,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";

interface TweetListProps {
  tweets: Tweet[];
  maxHeight?: string;
}

export function TweetList({ tweets, maxHeight = "100%" }: TweetListProps) {
  return (
    <ScrollArea className="w-full rounded-md border p-4" style={{ height: maxHeight }}>
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <Card key={tweet.tweet_id}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Link href={tweet.author.url} target="_blank" rel="noopener noreferrer">
                  <Avatar>
                    <AvatarImage
                      src={`https://unavatar.io/twitter/${tweet.author.handle}`}
                      alt={tweet.author.name}
                    />
                    <AvatarFallback>{tweet.author.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <p className="font-semibold flex items-center">
                    <span>{tweet.author.name}</span>
                    {tweet.author.verified && <BadgeCheck className="h-4 w-4 ml-1" />}
                  </p>
                  <p className="text-sm text-muted-foreground">@{tweet.author.handle}</p>
                </div>
              </div>

              <p className="mb-4">
                {tweet.text.slice(0, 100)}
                {tweet.text.length > 100 ? "..." : ""}
              </p>
              <div className="flex space-x-2 mb-2">
                {tweet.is_reply && <MessageCircle className="h-4 w-4 text-blue-500" />}
                {tweet.is_retweet && <Repeat className="h-4 w-4 text-blue-500" />}
                {tweet.is_quote && <Quote className="h-4 w-4 text-blue-500" />}
              </div>
              <div className="flex justify-between items-end space-x-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-2">
                  <span className="flex col-span-2 items-center text-sm text-muted-foreground">
                    <BarChart2 className="h-4 w-4 mr-1" />
                    {tweet.view_count.toLocaleString()}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 mr-1" />
                    {tweet.like_count.toLocaleString()}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {tweet.reply_count.toLocaleString()}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Bookmark className="h-4 w-4 mr-1" />
                    {tweet.bookmark_count.toLocaleString()}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Repeat className="h-4 w-4 mr-1" />
                    {tweet.retweet_count.toLocaleString()}
                  </span>
                </div>
                <Link
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-500 hover:underline"
                >
                  View Tweet
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
