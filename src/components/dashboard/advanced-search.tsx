"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter,
  Search,
  Heart,
  Bookmark,
  BarChart2,
  ExternalLink,
  MessageCircle,
  Calendar,
  Users,
  Image,
  Link as LinkIcon,
  Quote,
  Repeat,
  BadgeCheck,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { Tweet } from "@/lib/types";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { TweetList } from "./tweet-list";
import { FilterPopover, SearchFilters } from "./filter-popover";
import { toast } from "sonner";

type SortBy = "date" | "impressions" | "likes" | "comments" | "bookmarks" | "retweets";

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
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
    dateRange: "24h",
  });

  const { data: session } = useSession();

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight;
      console.log("setting height", height);

      setListHeight(height);
    }
  }, []);

  const handleSearch = async () => {
    if (!session?.user?.id) {
      return;
    }

    setIsLoading(true);
    posthog.capture("search_submitted", {
      userId: session?.user?.id,
      query: searchQuery,
      filters: filters,
    });

    const results = await fetch(`${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session?.user?.id,
        query: searchQuery,
        filters: filters,
      }),
    });

    if (!results.ok) {
      toast.error("Failed to search tweets");
      setIsLoading(false);
      return;
    }

    const data = await results.json();
    setSearchResults(data.results);
    setIsLoading(false);
  };

  const sortedResults = [...searchResults].sort((a, b) => {
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
      case "date":
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Advanced Twitter Search</CardTitle>
        <CardDescription>Find high performing tweets in any niche</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Enter a search term and/or select filters"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="grow"
          />
          <FilterPopover filters={filters} setFilters={setFilters} />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <div className="flex items-center space-x-2">
            <Label>Sort by:</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Date
                  </div>
                </SelectItem>
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
          {listHeight && <TweetList tweets={sortedResults} maxHeight={`${listHeight}px`} />}
        </div>
      </CardContent>
    </Card>
  );
}
