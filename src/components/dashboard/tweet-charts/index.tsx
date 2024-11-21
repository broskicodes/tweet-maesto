"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, ThumbsUp, Bookmark, MessageCircle, Repeat, BarChart3Icon, Zap, BarChart2Icon, BarChartIcon, BarChart4Icon } from "lucide-react";
import { Metric, metricLabels, Tweet } from "@/lib/types";
import { useState } from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { FilterPopover, SearchFilters } from "../filter-popover";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PricingModal } from "@/components/layout/pricing-modal";
import { PerformanceChart } from "./performance";
import { ViewsHistogram } from "./histogram";
import { ChartData } from "./shared";
import posthog from "posthog-js";

interface TweetPerformanceProps {
  tweets: Tweet[];
  showTimeRange?: boolean;
}

export function TweetCharts({ tweets, showTimeRange = false }: TweetPerformanceProps) {
  const { data: session } = useSession();
  const [showPricing, setShowPricing] = useState(false);
  const [activeChart, setActiveChart] = useState("distribution");
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

  const filteredTweets = tweets.filter((tweet) => {
    // Date range filter
    const tweetDate = new Date(tweet.date);
    const now = new Date();
    const diffInHours = (now.getTime() - tweetDate.getTime()) / (1000 * 60 * 60);

    if (filters.dateRange !== "all") {
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

    // Other filters
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

  // Transform tweet data for the chart
  const chartData: ChartData[] = filteredTweets
    .map((tweet) => {
      const engagement =
        tweet.like_count +
        tweet.reply_count +
        tweet.bookmark_count +
        tweet.retweet_count +
        tweet.quote_count;
      return {
        id: tweet.tweet_id,
        date: new Date(tweet.date),
        url: `https://twitter.com/user/status/${tweet.tweet_id}`,
        impressions: tweet.view_count,
        comments: tweet.reply_count,
        likes: tweet.like_count,
        bookmarks: tweet.bookmark_count,
        retweets: tweet.retweet_count + tweet.quote_count,
        engagement_rate: tweet.view_count > 0 ? (engagement / tweet.view_count) * 100 : 0,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date

  if (!session?.user?.subscribed) {
    return (
      <>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Tweet Performance Overview</CardTitle>
            <CardDescription>Analyze different metrics for your tweets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground text-center">
                Upgrade to access detailed tweet performance analytics
              </p>
              <Button onClick={() => {
                posthog.capture("upgrade-popup", {
                  trigger: "tweet-charts"
                });
                setShowPricing(true);
              }} variant="default">
                <Zap className="mr-2 h-4 w-4" />
                Get Access
              </Button>
            </div>
          </CardContent>
        </Card>
        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      </>
    );
  }

  if (!tweets.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tweet Performance Overview</CardTitle>
          <CardDescription>Analyze different metrics for your tweets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tweet Performance Overview</CardTitle>
            <CardDescription>Analyze different metrics for your tweets</CardDescription>
          </div>
          <div className="flex space-x-2 items-center">
            <Label className="text-base">Filters:</Label>
            <FilterPopover filters={filters} setFilters={setFilters} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          type="single"
          value={activeChart}
          onValueChange={setActiveChart}
          className="mb-4"
        >
          <ToggleGroupItem value="distribution">
            <BarChart2Icon className="h-4 w-4 mr-2" />
            Distribution
          </ToggleGroupItem>
          <ToggleGroupItem value="performance">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Performance
          </ToggleGroupItem>
        </ToggleGroup>
        {activeChart === "performance" && <PerformanceChart chartData={chartData} />}
        {activeChart === "distribution" && <ViewsHistogram data={chartData} tweets={tweets} />}
      </CardContent>
    </Card>
  );
}
