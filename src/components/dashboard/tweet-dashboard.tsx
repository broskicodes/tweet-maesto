"use client";

import { useState, useEffect } from "react";
import { AdvancedSearch } from "./advanced-search";
import { PopularTweets } from "./popular-tweets";
import { TweetHeatmap } from "./tweet-heatmap";
import { TweetImporter } from "./tweet-importer";
import { TweetPerformance } from "./tweet-performance";
import { Tweet } from "@/lib/types";
import { useSession } from "next-auth/react";
import { TweetDistribution } from "./tweet-distribution";

export function TweetDashboard() {
  const [popularTweets, setPopularTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchPopularTweets = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          "/api/tweets/popular?" +
            new URLSearchParams({
              minViews: "50000", // Minimum 50k views
              minLikes: "1", // Minimum 10 likes
              minComments: "1", // Minimum 1 comment
              minBookmarks: "1", // Minimum 1 bookmark
              minRetweets: "1", // Minimum 1 retweet
            }),
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tweets");
        }

        const data = await response.json();
        setPopularTweets(data);
      } catch (error) {
        console.error("Error fetching popular tweets:", error);
        setError(error instanceof Error ? error.message : "Failed to load tweets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularTweets();
  }, [session?.user?.id]);

  const handleImportSuccess = (newTweets: Tweet[]) => {
    setPopularTweets((prev) => [...prev, ...newTweets]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading tweets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Viral Tweet Explorer</h1>
          <p className="text-muted-foreground">Discover and analyze high-performing tweets</p>
        </div>
        <TweetImporter onImportSuccess={handleImportSuccess} />
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <PopularTweets tweets={popularTweets} />
          </div>
          <div className="col-span-1">
            <TweetHeatmap tweets={popularTweets} />
          </div>
        </div>
        <div className="grid grid-cols-1">
          <TweetPerformance tweets={popularTweets} showTimeRange={true} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TweetDistribution tweets={popularTweets} />
          <AdvancedSearch />
        </div>
      </div>
    </div>
  );
}
