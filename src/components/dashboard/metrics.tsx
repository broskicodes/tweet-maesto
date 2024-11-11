import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Metric, metricLabels, StatType, Tweet } from "@/lib/types";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BarChart3Icon,
  HashIcon,
  Eye,
  ThumbsUp,
  Bookmark,
  MessageCircle,
  Repeat,
  SquareSigmaIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

interface MetricsProps {
  tweets: Tweet[];
  prevPeriodTweets: Tweet[];
}

const metricToDataKey: Record<Metric, (tweet: Tweet) => number> = {
  impressions: (tweet) => tweet.view_count,
  comments: (tweet) => tweet.reply_count,
  likes: (tweet) => tweet.like_count,
  bookmarks: (tweet) => tweet.bookmark_count,
  retweets: (tweet) => tweet.retweet_count + tweet.quote_count,
  engagement_rate: (tweet) => {
    const engagement =
      tweet.like_count +
      tweet.reply_count +
      tweet.bookmark_count +
      tweet.retweet_count +
      tweet.quote_count;
    return tweet.view_count > 0 ? (engagement / tweet.view_count) * 100 : 0;
  },
};

const metricIcons = {
  impressions: <Eye className="h-4 w-4 text-muted-foreground" />,
  likes: <ThumbsUp className="h-4 w-4 text-muted-foreground" />,
  bookmarks: <Bookmark className="h-4 w-4 text-muted-foreground" />,
  comments: <MessageCircle className="h-4 w-4 text-muted-foreground" />,
  retweets: <Repeat className="h-4 w-4 text-muted-foreground" />,
  engagement_rate: <BarChart3Icon className="h-4 w-4 text-muted-foreground" />,
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}M`;
  }
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}K`;
  }
  const formatted = num.toFixed(1);
  return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;
};

export const Metrics = ({ tweets, prevPeriodTweets }: MetricsProps) => {
  const [statType, setStatType] = useState<StatType>("average");

  const handleStatTypeChange = (value: string | undefined) => {
    if (value) {
      setStatType(value as StatType);
    }
  };

  const stats = useMemo(() => {
    return Object.keys(metricLabels).reduce(
      (acc, metric) => {
        const getValue = metricToDataKey[metric as Metric];
        const currentValues = tweets.map((tweet) => getValue(tweet));
        const hasPrevPeriod = prevPeriodTweets.length > 0;
        const prevValues = prevPeriodTweets.map((tweet) => getValue(tweet));

        if (metric === "engagement_rate") {
          const totalEngagement = tweets.reduce(
            (sum, tweet) =>
              sum +
              tweet.like_count +
              tweet.reply_count +
              tweet.bookmark_count +
              tweet.retweet_count +
              tweet.quote_count,
            0,
          );
          const totalImpressions = tweets.reduce((sum, tweet) => sum + tweet.view_count, 0);
          const totalRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

          const tweetRates = tweets.map((tweet) => {
            const engagement =
              tweet.like_count +
              tweet.reply_count +
              tweet.bookmark_count +
              tweet.retweet_count +
              tweet.quote_count;
            return tweet.view_count > 0 ? (engagement / tweet.view_count) * 100 : 0;
          });
          const averageRate =
            tweetRates.length > 0
              ? tweetRates.reduce((sum, rate) => sum + rate, 0) / tweetRates.length
              : 0;

          // Calculate previous period stats
          const prevTotalRate = hasPrevPeriod
            ? (() => {
                const prevTotalEngagement = prevPeriodTweets.reduce(
                  (sum, tweet) =>
                    sum +
                    tweet.like_count +
                    tweet.reply_count +
                    tweet.bookmark_count +
                    tweet.retweet_count +
                    tweet.quote_count,
                  0,
                );
                const prevTotalImpressions = prevPeriodTweets.reduce(
                  (sum, tweet) => sum + tweet.view_count,
                  0,
                );
                return prevTotalImpressions > 0
                  ? (prevTotalEngagement / prevTotalImpressions) * 100
                  : 0;
              })()
            : 0;

          const prevAverageRate = hasPrevPeriod
            ? (() => {
                const prevTweetRates = prevPeriodTweets.map((tweet) => {
                  const engagement =
                    tweet.like_count +
                    tweet.reply_count +
                    tweet.bookmark_count +
                    tweet.retweet_count +
                    tweet.quote_count;
                  return tweet.view_count > 0 ? (engagement / tweet.view_count) * 100 : 0;
                });
                return prevTweetRates.length > 0
                  ? prevTweetRates.reduce((sum, rate) => sum + rate, 0) / prevTweetRates.length
                  : 0;
              })()
            : 0;

          const totalChange =
            hasPrevPeriod && prevTotalRate > 0
              ? ((totalRate - prevTotalRate) / prevTotalRate) * 100
              : null;
          const avgChange =
            hasPrevPeriod && prevAverageRate > 0
              ? ((averageRate - prevAverageRate) / prevAverageRate) * 100
              : null;

          acc[metric] = {
            total: totalRate,
            average: averageRate,
            totalChange: totalChange !== null ? totalChange.toFixed(1) : null,
            averageChange: avgChange !== null ? avgChange.toFixed(1) : null,
          };
        } else {
          const currentTotal = currentValues.reduce((sum, value) => sum + value, 0);
          const currentAvg = currentValues.length > 0 ? currentTotal / currentValues.length : 0;

          const prevTotal = hasPrevPeriod ? prevValues.reduce((sum, value) => sum + value, 0) : 0;
          const prevAvg =
            hasPrevPeriod && prevValues.length > 0 ? prevTotal / prevValues.length : 0;

          const totalChange =
            hasPrevPeriod && prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : null;
          const avgChange =
            hasPrevPeriod && prevAvg > 0 ? ((currentAvg - prevAvg) / prevAvg) * 100 : null;

          acc[metric as Metric] = {
            total: currentTotal,
            average: currentAvg,
            totalChange: totalChange !== null ? totalChange.toFixed(1) : null,
            averageChange: avgChange !== null ? avgChange.toFixed(1) : null,
          };
        }
        return acc;
      },
      {} as Record<
        Metric,
        {
          total: number;
          average: number;
          totalChange: string | null;
          averageChange: string | null;
        }
      >,
    );
  }, [tweets, prevPeriodTweets]);

  return (
    <div>
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Metric Statistics</CardTitle>
          <CardDescription>Totals and averages for each metric</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-2 text-lg font-medium">
              {statType === "total" ? "Totals" : "Averages"}
            </div>
            <ToggleGroup
              type="single"
              value={statType}
              onValueChange={handleStatTypeChange}
              size="sm"
            >
              <ToggleGroupItem value="average" aria-label="Show averages">
                <SquareSigmaIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="total" aria-label="Show totals">
                <HashIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid gap-4 grid-cols-2">
            {(Object.keys(metricLabels) as Metric[]).map((metric) => (
              <Card key={metric} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {metricIcons[metric]}
                    <CardTitle className="text-sm font-medium">{metricLabels[metric]}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric === "engagement_rate"
                      ? `${formatNumber(statType === "total" ? stats[metric].total : stats[metric].average)}%`
                      : formatNumber(
                          statType === "total" ? stats[metric].total : stats[metric].average,
                        )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statType === "total" ? "Total" : "Average"}
                  </p>
                  <div className="flex items-center pt-1">
                    {(statType === "total"
                      ? stats[metric].totalChange
                      : stats[metric].averageChange) === null ? (
                      <span className="text-xs text-muted-foreground">--</span>
                    ) : (
                      <>
                        {parseFloat(
                          statType === "total"
                            ? stats[metric].totalChange!
                            : stats[metric].averageChange!,
                        ) > 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            parseFloat(
                              statType === "total"
                                ? stats[metric].totalChange!
                                : stats[metric].averageChange!,
                            ) > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {statType === "total"
                            ? stats[metric].totalChange
                            : stats[metric].averageChange}
                          %
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
