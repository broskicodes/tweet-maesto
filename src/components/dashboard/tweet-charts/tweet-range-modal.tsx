import { Tweet } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TweetList } from "@/components/dashboard/tweet-list";
import { FilterPopover, SearchFilters } from "@/components/dashboard/filter-popover";
import { useState, useMemo } from "react";

interface TweetRangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tweets: Tweet[];
  metric: string;
  range: string;
}

export function TweetRangeModal({
  open,
  onOpenChange,
  tweets,
  metric,
  range,
}: TweetRangeModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    verified: false,
    mediaOnly: false,
    linksOnly: false,
    threadOnly: false,
    quoteTweetsOnly: false,
    minLikes: "",
    minComments: "",
    minRetweets: "",
    dateRange: "all",
  });

  const filteredTweets = useMemo(() => {
    return tweets.filter((tweet) => {
      if (filters.verified && !tweet.author.verified) return false;
      if (filters.mediaOnly && !tweet.entities?.media?.length) return false;
      if (filters.linksOnly && !tweet.entities?.urls?.length) return false;
      if (filters.threadOnly && !tweet.is_thread) return false;
      if (filters.quoteTweetsOnly && !tweet.is_quote) return false;
      if (filters.minLikes && tweet.like_count < parseInt(filters.minLikes)) return false;
      if (filters.minComments && tweet.reply_count < parseInt(filters.minComments)) return false;
      if (filters.minRetweets && tweet.retweet_count < parseInt(filters.minRetweets)) return false;
      
      if (filters.dateRange !== "all") {
        const tweetDate = new Date(tweet.date);
        const now = new Date();
        const diff = now.getTime() - tweetDate.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        
        if (filters.dateRange === "24h" && days > 1) return false;
        if (filters.dateRange === "7d" && days > 7) return false;
        if (filters.dateRange === "28d" && days > 28) return false;
      }
      
      return true;
    });
  }, [tweets, filters]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="">
          <DialogTitle>
            Tweets with {metric} in range {range}
          </DialogTitle>
          <DialogDescription>
            Showing {filteredTweets.length} of {tweets.length} tweets
          </DialogDescription>
        </DialogHeader>
        <div className="w-full justify-end flex flex-row items-center">
          <span className="font-medium mr-2">Filters:</span>
          <FilterPopover filters={filters} setFilters={setFilters} />
        </div>
        <TweetList tweets={filteredTweets} maxHeight="600px" />
      </DialogContent>
    </Dialog>
  );
} 