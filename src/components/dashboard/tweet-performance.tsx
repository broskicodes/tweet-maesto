"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, ThumbsUp, Bookmark, MessageCircle, Repeat, BarChart3Icon } from "lucide-react";
import { Metric, metricLabels, Tweet } from "@/lib/types";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { FilterPopover, SearchFilters } from "./filter-popover";

const metricIcons = {
  impressions: <Eye className="h-4 w-4" />,
  likes: <ThumbsUp className="h-4 w-4" />,
  bookmarks: <Bookmark className="h-4 w-4" />,
  comments: <MessageCircle className="h-4 w-4" />,
  retweets: <Repeat className="h-4 w-4" />,
  engagement_rate: <BarChart3Icon className="h-4 w-4" />,
};

type TimeRange = "24h" | "7d" | "28d" | "all";

interface TweetPerformanceProps {
  tweets: Tweet[];
  showTimeRange?: boolean;
}

const CustomTooltip = ({ active, payload, label, selectedMetric }: any) => {
  if (!active || !payload || !payload.length) return null;

  const tweet = payload[0].payload;

  // Normalize values to a 0-100 scale
  const normalizeValue = (value: number, metric: string) => {
    // Find reasonable maximum values for each metric
    const maxValues = {
      impressions: 1000000, // 1M
      likes: 5000, // 1K
      comments: 250, // 100
      bookmarks: 3500, // 100
      retweets: 1000,
      engagement_rate: 3,
    };

    const max = maxValues[metric as keyof typeof maxValues];
    return (value / max) * 100 > 100 ? 100 : (value / max) * 100;
  };

  const radarData = [
    { metric: "impressions", value: normalizeValue(tweet.impressions, "impressions") },
    { metric: "likes", value: normalizeValue(tweet.likes, "likes") },
    { metric: "comments", value: normalizeValue(tweet.comments, "comments") },
    { metric: "bookmarks", value: normalizeValue(tweet.bookmarks, "bookmarks") },
    { metric: "retweets", value: normalizeValue(tweet.retweets, "retweets") },
    { metric: "engagement_rate", value: normalizeValue(tweet.engagement_rate, "engagement_rate") },
  ];

  const formatValue = (value: number, name: string): string => {
    if (name === "Engagement Rate") {
      const rounded = value.toFixed(1);
      return rounded.endsWith(".0") ? `${Math.round(value)}%` : `${rounded}%`;
    }

    if (value >= 1_000_000) {
      const rounded = (value / 1_000_000).toFixed(1);
      return rounded.endsWith(".0") ? `${Math.round(value / 1_000_000)}M` : `${rounded}M`;
    }

    if (value >= 1_000) {
      const rounded = (value / 1_000).toFixed(1);
      return rounded.endsWith(".0") ? `${Math.round(value / 1_000)}K` : `${rounded}K`;
    }

    return Math.round(value).toString();
  };

  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    const icon = metricIcons[payload.value as keyof typeof metricIcons];
    const isSelectedMetric = payload.value === selectedMetric;

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject
          x="-12"
          y="-12"
          width="24"
          height="24"
          style={{
            color: isSelectedMetric ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          }}
        >
          <div
            className={`h-full w-full flex items-center justify-center transition-colors
            ${isSelectedMetric ? "text-primary" : ""}`}
          >
            {icon}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="bg-background border rounded-lg p-4 shadow-lg">
      <p className="font-medium">{format(new Date(label), "MMM d, yyyy")}</p>
      <div className="w-[200px] h-[200px] mt-2">
        <ResponsiveContainer>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={renderPolarAngleAxis} />
            <Radar name="Metrics" dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1">
        <p className="font-medium">
          {metricLabels[payload[0].name.toLowerCase().replaceAll(" ", "_") as Metric]}:{" "}
          {formatValue(payload[0].value, payload[0].name)}
        </p>
      </div>
    </div>
  );
};

export function TweetPerformance({ tweets, showTimeRange = false }: TweetPerformanceProps) {
  const [selectedMetric, setSelectedMetric] = useState<Metric>("impressions");
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

  const handleMetricChange = (value: string | undefined) => {
    if (value) {
      setSelectedMetric(value as Metric);
    }
  };

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
  const chartData = filteredTweets
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

  // Add click handler
  const handleBarClick = useCallback((data: any) => {
    if (data && data.url) {
      window.open(data.url, "_blank");
    }
  }, []);

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
        <CardTitle>Tweet Performance Overview</CardTitle>
        <CardDescription>Analyze different metrics for your tweets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex space-x-2 items-center justify-end w-full">
            <Label className="text-base">Filters:</Label>
            <FilterPopover filters={filters} setFilters={setFilters} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-lg font-medium">
              {selectedMetric.charAt(0).toUpperCase() +
                selectedMetric.slice(1).replaceAll("_", " ")}
            </div>
            <ToggleGroup
              type="single"
              value={selectedMetric}
              onValueChange={handleMetricChange}
              className="justify-start"
            >
              {(Object.keys(metricLabels) as Metric[]).map((key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  aria-label={`Show ${metricLabels[key]}`}
                  className="flex items-center gap-2"
                >
                  {metricIcons[key as keyof typeof metricIcons]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "MMM d")} />
              <YAxis
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)}M`
                    : value >= 1_000
                      ? `${(value / 1_000).toFixed(1)}K`
                      : value.toString()
                }
              />
              <Tooltip
                content={(props) => <CustomTooltip {...props} selectedMetric={selectedMetric} />}
              />
              <Legend />
              <Bar
                dataKey={selectedMetric}
                fill="hsl(var(--primary))"
                name={metricLabels[selectedMetric]}
                cursor="pointer"
                onClick={handleBarClick}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
