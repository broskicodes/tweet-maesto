"use client";

import { Tweet } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface TweetDistributionProps {
  tweets: Tweet[];
}

type TimeRange = "24h" | "7d" | "28d" | "all";

type ViewRange = {
  min: number;
  max: number | null;
  label: string;
};

const VIEW_RANGES: ViewRange[] = [
  { min: 50000, max: 100000, label: "50K-100K impressions" },
  { min: 100000, max: 500000, label: "100K-500K impressions" },
  { min: 500000, max: 1000000, label: "500K-1M impressions" },
  { min: 1000000, max: null, label: "1M+ impressions" },
];

const CATEGORIES = [
  { name: "Plain", color: "#94A3B8" },
  { name: "Links", color: "#3B82F6" },
  { name: "Media", color: "#10B981" },
  { name: "Threads", color: "#F43F5E" },
  { name: "Long", color: "#8B5CF6" },
];

interface CategoryCounts {
  threads: number;
  media: number;
  links: number;
  plain: number;
  long: number;
}

export function TweetDistribution({ tweets }: TweetDistributionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const filteredTweets = tweets.filter((tweet) => {
    if (timeRange === "all") return true;

    const tweetDate = new Date(tweet.date);
    const now = new Date();
    const diffInHours = (now.getTime() - tweetDate.getTime()) / (1000 * 60 * 60);

    switch (timeRange) {
      case "24h":
        return diffInHours <= 24;
      case "7d":
        return diffInHours <= 24 * 7;
      case "28d":
        return diffInHours <= 24 * 28;
      default:
        return true;
    }
  });

  const categorizeTweets = (tweets: Tweet[], viewRange: ViewRange): CategoryCounts => {
    const filtered = tweets.filter(
      (tweet) =>
        tweet.view_count >= viewRange.min &&
        (viewRange.max === null || tweet.view_count < viewRange.max),
    );

    return filtered.reduce(
      (acc, tweet) => {
        if (tweet.is_thread) {
          acc.threads++;
        } else if (tweet.entities?.media && tweet.entities.media.length > 0) {
          acc.media++;
        } else if (tweet.entities?.urls && tweet.entities.urls.length > 0) {
          acc.links++;
        } else if (tweet.text.length > 280) {
          acc.long++;
        } else {
          acc.plain++;
        }
        return acc;
      },
      { threads: 0, media: 0, links: 0, plain: 0, long: 0 },
    );
  };

  const preparePieData = (counts: CategoryCounts) => {
    return [
      { name: "Plain", value: counts.plain },
      { name: "Links", value: counts.links },
      { name: "Media", value: counts.media },
      { name: "Threads", value: counts.threads },
      { name: "Long", value: counts.long },
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tweet Content Distribution</CardTitle>
        <CardDescription>
          Analysis of tweet content types across different view ranges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="border rounded-lg p-3 space-y-2">
            <Label className="text-sm text-muted-foreground">Legend</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {CATEGORIES.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm whitespace-nowrap">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 justify-end">
              <Label className="text-base whitespace-nowrap">Time Range:</Label>
              <div className="flex items-center rounded-md space-x-1">
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={timeRange === "24h"}
                  onPressedChange={() => setTimeRange("24h")}
                >
                  24h
                </Toggle>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={timeRange === "7d"}
                  onPressedChange={() => setTimeRange("7d")}
                >
                  7d
                </Toggle>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={timeRange === "28d"}
                  onPressedChange={() => setTimeRange("28d")}
                >
                  28d
                </Toggle>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={timeRange === "all"}
                  onPressedChange={() => setTimeRange("all")}
                >
                  All
                </Toggle>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {VIEW_RANGES.map((range, index) => {
            const counts = categorizeTweets(filteredTweets, range);
            const data = preparePieData(counts);
            const total = Object.values(counts).reduce((a, b) => a + b, 0);

            return (
              <div key={index} className="flex flex-col">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={64}
                        label={(entry) => (entry.value > 0 ? `${entry.value}` : "")}
                      >
                        {data.map((_, index) => (
                          <Cell key={index} fill={CATEGORIES[index].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} tweets`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <h3 className="text-sm font-medium">{range.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Total tweets: {total}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
