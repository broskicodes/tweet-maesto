import { Tweet } from "@/lib/types";
import { useState, useEffect } from "react";
import { Eye, ThumbsUp, Bookmark, MessageCircle, Repeat, Quote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { metricIcons } from "./tweet-charts/shared";

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sum_x = x.reduce((a, b) => a + b, 0);
  const sum_y = y.reduce((a, b) => a + b, 0);
  const sum_xy = x.reduce((a, b, i) => a + b * y[i], 0);
  const sum_x2 = x.reduce((a, b) => a + b * b, 0);
  const sum_y2 = y.reduce((a, b) => a + b * b, 0);

  const correlation =
    (n * sum_xy - sum_x * sum_y) /
    Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));

  return parseFloat(correlation.toFixed(3));
}

const metricLabels = {
  likes: "Likes",
  replies: "Comments",
  retweets: "Retweets",
  bookmarks: "Bookmarks",
  quotes: "Quotes",
};

export function CorrelationCard() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const res = await fetch("/api/tweets/popular");
        if (!res.ok) throw new Error("Failed to fetch tweets");
        const data = await res.json();
        setTweets(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTweets();
  }, []);

  if (isLoading)
    return (
      <Card className="w-96">
        <CardContent className="pt-6">Loading...</CardContent>
      </Card>
    );
  if (!tweets.length) return null;

  const correlations = {
    likes: calculateCorrelation(
      tweets.map((t) => t.like_count),
      tweets.map((t) => t.view_count),
    ),
    replies: calculateCorrelation(
      tweets.map((t) => t.reply_count),
      tweets.map((t) => t.view_count),
    ),
    retweets: calculateCorrelation(
      tweets.map((t) => t.retweet_count),
      tweets.map((t) => t.view_count),
    ),
    bookmarks: calculateCorrelation(
      tweets.map((t) => t.bookmark_count),
      tweets.map((t) => t.view_count),
    ),
    quotes: calculateCorrelation(
      tweets.map((t) => t.quote_count),
      tweets.map((t) => t.view_count),
    ),
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Tweet View Correlation</CardTitle>
        <CardDescription>Which tweet metrics impact virality the most?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(correlations)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .map(([metric, value]) => (
            <div key={metric} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-gray-500">
                  {metric === "likes" && <ThumbsUp className="h-5 w-5" />}
                  {metric === "replies" && <MessageCircle className="h-5 w-5" />}
                  {metric === "retweets" && <Repeat className="h-5 w-5" />}
                  {metric === "bookmarks" && <Bookmark className="h-5 w-5" />}
                  {metric === "quotes" && <Quote className="h-5 w-5" />}
                </div>
                <span className="text-lg font-bold">
                  {metricLabels[metric as keyof typeof metricLabels]}
                </span>
              </div>
              <span
                className={`font-mono text-xl font-bold ${
                  value > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {value > 0 ? "+" : ""}
                {value}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
