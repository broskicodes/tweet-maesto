"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

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

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        <PostHogPageView />
        {children}
      </PostHogProvider>
    </SessionProvider>
  );
}
