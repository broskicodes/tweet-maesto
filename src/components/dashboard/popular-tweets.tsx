"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TweetList } from "./tweet-list";
import { Tweet } from "@/lib/types";
import { Heart, BarChart2, MessageCircle, Bookmark, Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { FilterPopover, SearchFilters } from "./filter-popover";

type SortMetric = "impressions" | "likes" | "comments" | "bookmarks" | "retweets";
type TimeRange = "24h" | "7d" | "28d" | "all";

interface PopularTweetsProps {
  tweets: Tweet[];
}

export function PopularTweets({ tweets }: PopularTweetsProps) {
  const [sortBy, setSortBy] = useState<SortMetric>("impressions");
  const [listHeight, setListHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    verified: false,
    mediaOnly: false,
    linksOnly: false,
    threadOnly: false,
    quoteTweetsOnly: false,
    minLikes: "",
    minComments: "",
    minRetweets: "",
    dateRange: "7d",
  });

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight;
      setListHeight(height);
    }
  }, []);

  const filteredTweets = tweets.filter((tweet) => {
    if (filters.dateRange !== "all") {
      const tweetDate = new Date(tweet.date);
      const now = new Date();
      const diffInHours = (now.getTime() - tweetDate.getTime()) / (1000 * 60 * 60);

      switch (filters.dateRange) {
        case "24h":
          if (diffInHours > 24) return false;
          break;
        case "7d":
          if (diffInHours > 24 * 7) return false;
          break;
        case "28d":
          if (diffInHours > 24 * 28) return false;
          break;
      }
    }

    if (filters.verified && !tweet.author.verified) return false;
    if (filters.mediaOnly && !tweet.entities?.media?.length) return false;
    if (filters.linksOnly && !tweet.entities?.urls?.length) return false;
    if (filters.threadOnly && !tweet.is_thread) return false;
    if (filters.quoteTweetsOnly && !tweet.is_quote) return false;
    if (filters.minLikes && tweet.like_count < parseInt(filters.minLikes)) return false;
    if (filters.minComments && tweet.reply_count < parseInt(filters.minComments)) return false;
    if (filters.minRetweets && tweet.retweet_count < parseInt(filters.minRetweets)) return false;

    return true;
  });

  const sortedTweets = [...filteredTweets].sort((a, b) => {
    switch (sortBy) {
      case "impressions":
        return b.view_count - a.view_count;
      case "likes":
        return b.like_count - a.like_count;
      case "comments":
        return b.reply_count - a.reply_count;
      case "bookmarks":
        return b.bookmark_count - a.bookmark_count;
      case "retweets":
        return b.retweet_count - a.retweet_count;
      default:
        return b.view_count - a.view_count;
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Popular Tweets</CardTitle>
          <CardDescription>Top performing tweets by engagement</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 justify-end sm:justify-start">
            <Label className="text-base">Filters:</Label>
            <FilterPopover filters={filters} setFilters={setFilters} />
          </div>
          <div className="flex items-center gap-4 justify-end">
            <Label className="text-sm whitespace-nowrap">Sort By:</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortMetric)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impressions">
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Impressions
                  </div>
                </SelectItem>
                <SelectItem value="likes">
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Likes
                  </div>
                </SelectItem>
                <SelectItem value="comments">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comments
                  </div>
                </SelectItem>
                <SelectItem value="bookmarks">
                  <div className="flex items-center">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmarks
                  </div>
                </SelectItem>
                <SelectItem value="retweets">
                  <div className="flex items-center">
                    <Repeat className="w-4 h-4 mr-2" />
                    Retweets
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div ref={containerRef} className="flex-1">
          {listHeight && <TweetList tweets={sortedTweets} maxHeight={`${listHeight}px`} />}
        </div>
      </CardContent>
    </Card>
  );
}
