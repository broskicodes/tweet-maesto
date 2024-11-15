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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, BarChart2, MessageCircle, Bookmark, Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";

interface TweetRangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tweets: Tweet[];
  metric: string;
  range: string;
}

type SortMetric = "impressions" | "likes" | "comments" | "bookmarks" | "retweets";

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

  const [sortBy, setSortBy] = useState<SortMetric>("impressions");

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
        <div className="w-full justify-end flex flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap font-bold">Filters:</Label>
            <FilterPopover filters={filters} setFilters={setFilters} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap font-bold">Sort By:</Label>
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
        <TweetList tweets={sortedTweets} maxHeight="600px" />
      </DialogContent>
    </Dialog>
  );
} 