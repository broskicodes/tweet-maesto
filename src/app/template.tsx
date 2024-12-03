"use client";

import { TwitterScrapeType } from "@/lib/types";
import { useWebSocketStore, ClientMessageType, MessageStatus } from "@/store/websocket";
import { SessionProvider, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";

const PostHogPageView = dynamic(() => import("../components/posthog-page-view"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
  });
}

function OnSessionConnectStuff() {
  const { data: session } = useSession();
  const { status, trackedMessages, send } = useWebSocketStore();
  const [messageId, setMessageId] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const setupTolt = async () => {
    if (session) {
      // @ts-ignore
      if (window.tolt_referral) {
        // @ts-ignore
        window.tolt.signup(`@${session.user.handle}`);
      }
    }
  }

  const setupPosthog = async () => {
    if (session) {
      posthog.identify(session.user.id, {
        handle: session.user.handle,
        // name: session.user.name || undefined,
      });
    }
  }

  const setupScrape = useCallback(async () => {
    if (session && status === "connected") {
      if (messageId || isScraping) {
        return
      }

      if (session.user.created_at && new Date().getTime() - new Date(session.user.created_at).getTime() <= 30000) {
        setIsScraping(true)

        console.log("Initializing Twitter handle:", session.user.handle);
        const msgId = send({
          type: ClientMessageType.Scrape,
          payload: {
            scrapeType: TwitterScrapeType.Daily,
            handles: [session.user.handle],
          },
        });

        setMessageId(msgId)
      }
    }
  }, [session, status, messageId, isScraping]);

  useEffect(() => {
    if (session?.user?.id) {
      setupTolt();
      setupPosthog();
    }
  }, [session]);

  useEffect(() => {
    setupScrape();
  }, [setupScrape]);

  useEffect(() => {
    if (messageId) {
      const tracked = trackedMessages.get(messageId)
      if (tracked?.status === MessageStatus.Success || tracked?.status === MessageStatus.Error) {
        setIsScraping(false)
        if (tracked?.status === MessageStatus.Error) {
          console.error("Failed to initialize Twitter handle", tracked.response)
        }
      }
    }
  }, [trackedMessages, messageId])

  return null;
}

export default function Template({ children }: { children: React.ReactNode }) {
  const { connect } = useWebSocketStore();

  useEffect(() => {
    connect()
  }, [])

  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        <PostHogPageView />
        <OnSessionConnectStuff />
        {children}
      </PostHogProvider>
    </SessionProvider>
  );
}
