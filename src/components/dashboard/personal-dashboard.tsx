"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Metric, Tweet, TwitterScrapeType } from "@/lib/types";
import { TweetPerformance } from "./tweet-performance";
import { Metrics } from "./metrics";
import { PopularTweets } from "./popular-tweets";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSearch,
} from "@/components/ui/select";
import { addWeeks, format, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { SimilarAccounts } from "./similar-accounts";

interface DateRange {
  start: Date;
  end: Date;
  label: string;
  value: string;
}

interface TwitterHandle {
  handle: string;
  pfp: string | null;
  url: string;
}

export function PersonalDashboard() {
  const { data: session } = useSession();
  const [tweetData, setTweetData] = useState<Tweet[]>([]);
  const [filteredTweets, setFilteredTweets] = useState<Tweet[]>([]);
  const [prevPeriodTweets, setPrevPeriodTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [selectedHandle, setSelectedHandle] = useState<TwitterHandle | null>(null);
  const [handles, setHandles] = useState<TwitterHandle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    if (session?.user?.handle) {
      setSelectedHandle({
        handle: session.user.handle,
        pfp: `https://unavatar.io/twitter/${session.user.handle}`,
        url: `https://x.com/${session.user.handle}`,
      });
    }
  }, [session?.user?.handle]);

  useEffect(() => {
    const fetchTweets = async () => {
      if (!selectedHandle) return;

      try {
        const response = await fetch(`/api/tweets/${selectedHandle.handle}`);

        if (!response.ok) {
          throw new Error("Failed to fetch tweets");
        }

        const data: Tweet[] = await response.json();
        setTweetData(data);
        setFilteredTweets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching tweets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTweets();
  }, [selectedHandle]);

  useEffect(() => {
    if (!tweetData.length) return;

    const oldestTweetDate = new Date(Math.min(...tweetData.map((t) => new Date(t.date).getTime())));
    const now = new Date();
    const ranges: DateRange[] = [];

    // Add "All Time" option
    ranges.push({
      start: oldestTweetDate,
      end: now,
      label: "All Time",
      value: "all",
    });

    // Calculate weekly ranges from oldest tweet to now
    let currentStart = startOfWeek(oldestTweetDate, { weekStartsOn: 0 });
    let weekCount = 0;

    while (currentStart <= now) {
      const rangeEnd = endOfWeek(currentStart, { weekStartsOn: 0 });
      ranges.push({
        start: currentStart,
        end: rangeEnd,
        label: `${format(currentStart, "MMM d")} - ${format(rangeEnd, "MMM d")}`,
        value: `week_${weekCount}`,
      });
      currentStart = addWeeks(currentStart, 1);
      weekCount++;
    }

    setDateRanges(ranges);
  }, [tweetData]);

  useEffect(() => {
    if (!tweetData.length || !dateRanges.length) return;

    if (selectedRange === "all") {
      setFilteredTweets(tweetData);
      setPrevPeriodTweets([]);
      return;
    }

    const selectedDateRange = dateRanges.find((range) => range.value === selectedRange);

    if (!selectedDateRange) return;

    const filtered = tweetData.filter((tweet) => {
      const tweetDate = new Date(tweet.date);
      return tweetDate >= selectedDateRange.start && tweetDate <= selectedDateRange.end;
    });

    const periodLength = selectedDateRange.end.getTime() - selectedDateRange.start.getTime();
    const prevPeriodStart = new Date(selectedDateRange.start.getTime() - periodLength);
    const prevPeriodEnd = new Date(selectedDateRange.start);

    const prevPeriod = tweetData.filter((tweet) => {
      const tweetDate = new Date(tweet.date);
      return tweetDate >= prevPeriodStart && tweetDate < prevPeriodEnd;
    });

    setFilteredTweets(filtered);
    setPrevPeriodTweets(prevPeriod);
  }, [selectedRange, tweetData, dateRanges]);

  useEffect(() => {
    const fetchHandles = async () => {
      try {
        const response = await fetch(`/api/handles`);
        if (!response.ok) {
          throw new Error("Failed to fetch handles");
        }
        const data: TwitterHandle[] = await response.json();
        setHandles(data);
      } catch (err) {
        console.error("Error fetching handles:", err);
      }
    };

    fetchHandles();
  }, []);

  const handleTweetScrape = async (scrapeType: TwitterScrapeType) => {
    if (!selectedHandle) return;

    try {
      setIsScraping(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scrapeType, handles: [selectedHandle.handle] }),
      });

      if (!response.ok) throw new Error(`Failed to ${scrapeType} tweets`);

      const waitTime = scrapeType === TwitterScrapeType.Update ? 120000 : 300000;
      const message =
        scrapeType === TwitterScrapeType.Update
          ? "Scraping tweets, will refresh in 2 minutes..."
          : "Initializing tweets, this may take a few minutes...";

      toast.success(message);

      setTimeout(async () => {
        setIsLoading(true);

        const tweetsResponse = await fetch(`/api/tweets/${selectedHandle.handle}`);
        if (!tweetsResponse.ok) {
          toast.error("Failed to fetch new tweets");
          setIsLoading(false);
          setIsScraping(false);
          return;
        }

        const data: Tweet[] = await tweetsResponse.json();
        setTweetData(data);
        setFilteredTweets(data);
        setIsLoading(false);
        setIsScraping(false);

        toast.success(
          scrapeType === TwitterScrapeType.Update ? "Tweets refreshed!" : "Tweets initialized!",
        );
      }, waitTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(`Error ${scrapeType} tweets:`, err);
      setIsScraping(false);
    }
  };

  const handleImportNewHandle = async () => {
    if (!searchQuery) return;

    try {
      setIsScraping(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrapeType: TwitterScrapeType.Micro,
          handles: [searchQuery],
        }),
      });

      if (!response.ok) throw new Error("Failed to initialize tweets");

      toast.success("Initializing tweets for new handle, this may take a few minutes...");

      // Refresh handles list after 5 minutes
      setTimeout(async () => {
        const handlesResponse = await fetch("/api/handles");
        if (handlesResponse.ok) {
          const newHandles = await handlesResponse.json();
          setHandles(newHandles);
          setIsScraping(false);
          toast.success("New handle initialized!");
        }
      }, 300000);
    } catch (err) {
      toast.error("Failed to initialize new handle");
      setIsScraping(false);
    }
  };

  const doIt = async () => {
    const response = await fetch("/api/it", {
      method: "POST",
      body: JSON.stringify({ 
        handle: selectedHandle?.handle, 
        // all: true 
      }),
    });

    const data = await response.json();
    console.log(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading tweets...</p>
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

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Please sign in to view your tweet analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">Twitter Analytics for:</h1>
            {selectedHandle && selectedHandle.pfp && (
              <a href={selectedHandle.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={selectedHandle.pfp}
                  alt={`@${selectedHandle.handle}`}
                  className="w-10 h-10 rounded-full"
                />
              </a>
            )}
            <div className="w-48">
              <Select
                value={selectedHandle?.handle}
                onValueChange={(value) => {
                  const handle = handles.find((handle) => handle.handle === value);

                  setSelectedHandle(
                    handle
                      ? {
                          handle: handle.handle,
                          pfp: `https://unavatar.io/twitter/${handle.handle}`,
                          url: `https://x.com/${handle.handle}`,
                        }
                      : null,
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select handle" />
                </SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 bg-popover z-10 border-b">
                    <SelectSearch
                      placeholder="Search handles..."
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <SelectGroup>
                    <SelectLabel>Handles</SelectLabel>
                    {session?.user?.handle && (
                      <SelectItem value={session.user.handle}>
                        @{session.user.handle} (You)
                      </SelectItem>
                    )}
                    {handles
                      .filter(
                        (h) =>
                          h.handle.toLowerCase().includes(searchQuery.toLowerCase()) &&
                          h.handle !== session?.user?.handle,
                      )
                      .map((handle) => (
                        <SelectItem key={handle.handle} value={handle.handle}>
                          @{handle.handle}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                  {searchQuery &&
                    !handles.some((h) => h.handle.toLowerCase() === searchQuery.toLowerCase()) && (
                      <Button
                        variant="outline"
                        className="w-full mt-2 mx-2"
                        onClick={handleImportNewHandle}
                        disabled={isScraping}
                      >
                        {isScraping ? "Initializing..." : `Add @${searchQuery}`}
                      </Button>
                    )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="w-fit ml-auto flex flex-col space-y-2 items-end">
          {/* <Button variant="outline" onClick={doIt}>
            do it
          </Button> */}
          <div className="flex items-center gap-2 mt-4">
            {process.env.NEXT_PUBLIC_ENV_URL === "http://localhost:3000" && (
              <Button
                variant="outline"
                onClick={() => handleTweetScrape(TwitterScrapeType.Initialize)}
                disabled={isLoading || !selectedHandle || isScraping}
                className="flex items-center gap-2"
              >
                <Download className={`h-4 w-4 ${isScraping ? "animate-spin" : ""}`} />
                {isScraping ? "Initializing..." : "Initialize Tweets"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleTweetScrape(TwitterScrapeType.Update)}
              disabled={isLoading || !selectedHandle || isScraping}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isScraping ? "animate-spin" : ""}`} />
              {isScraping ? "Refreshing..." : "Refresh Tweets"}
            </Button>
          </div>
          <div className="flex space-x-2 items-center">
            <label
              htmlFor="date-range"
              className="whitespace-nowrap text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select Date Range:
            </label>
            <div className="w-64">
              <Select value={selectedRange} onValueChange={setSelectedRange}>
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Ranges</SelectLabel>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 pt-2 pb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PopularTweets tweets={filteredTweets} />
          {selectedHandle && <SimilarAccounts 
            handle={selectedHandle.handle} 
            onAccountSelect={(handle) => {
              const newHandle = handles.find(h => h.handle === handle);
              setSelectedHandle(
                newHandle ? {
                  handle: newHandle.handle,
                  pfp: `https://unavatar.io/twitter/${newHandle.handle}`,
                  url: `https://x.com/${newHandle.handle}`
                } : null
              );
            }} 
          />}
        </div>
        <TweetPerformance tweets={filteredTweets} />
        <Metrics tweets={filteredTweets} prevPeriodTweets={prevPeriodTweets} />
      </main>
    </div>
  );
}
