import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientMessageType, MessageStatus, useWebSocketStore } from "@/store/websocket";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { TwitterScrapeType } from "@/lib/types";

interface Follower {
  id: string;
  handle: string;
  followers: number;
}

export default function Planner() {
  const { data: session } = useSession();
  const { send, trackedMessages } = useWebSocketStore();
  const [isLoading, setIsLoading] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const msgId = send({
        type: ClientMessageType.Followers,
        payload: {
          handle: session.user.handle,
        },
      });
      setMessageId(msgId);
    } catch (error) {
      console.error("Failed to sync:", error);
      setIsLoading(false);
    }
  }, [send, setMessageId, session]);

  const handleSearch = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    const searchResponse = await fetch(`/api/planner/search`, {
      method: "POST",
    });
    const { users } = await searchResponse.json();
    console.log(users);

    try {
      setIsLoading(true);
      const msgId = send({
        type: ClientMessageType.Users,
        payload: {
          handles: users,
        },
      });
      setMessageId(msgId);
    } catch (error) {
      console.error("Failed to sync:", error);
      setIsLoading(false);
    }
  }, [send, setMessageId, session]);

  const handleScrape = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const msgId = send({
        type: ClientMessageType.Scrape,
        payload: {
          scrapeType: TwitterScrapeType.Micro,
          handles: ["safwaankay", "wuweiweiwu"],
        },
      });
      setMessageId(msgId);
    } catch (error) {
      console.error("Failed to sync:", error);
      setIsLoading(false);
    }
  }, [send, setMessageId, session]);

  useEffect(() => {
    if (messageId && trackedMessages.has(messageId)) {
      const msg = trackedMessages.get(messageId);
      if (msg?.status === MessageStatus.Success) {
        switch (msg.message.type) {
          case ClientMessageType.Users:
            const { users } = msg.response?.payload as { users: Follower[] };
            console.log(users.sort((a, b) => b.followers - a.followers));
            break;
          case ClientMessageType.Followers:
            const { followers } = msg.response?.payload as { followers: Follower[] };
            console.log(followers);
            break;
          case ClientMessageType.Scrape:
            console.log("done");
            break;
        }
        setMessageId(null);
        setIsLoading(false);
      }
    }
  }, [trackedMessages, messageId]);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex gap-2">
        <Button onClick={handleStart} disabled={isLoading}>
          {isLoading ? "Starting..." : "Get Started"}
        </Button>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
        <Button onClick={handleScrape} disabled={isLoading}>
          {isLoading ? "Scraping..." : "Scrape"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Account Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add goal tracking metrics, growth targets */}
            <p className="text-gray-600">Set and track your social media goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Topics</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add topic management, categories */}
            <p className="text-gray-600">Organize and plan your content themes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspiration</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add trending topics, content ideas */}
            <p className="text-gray-600">Discover trending topics and content ideas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
