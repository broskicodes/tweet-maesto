import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tweet Maestro",
  description: "Plan and execute your ideal Twitter strategy.",
  openGraph: {
    siteName: "Tweet Maestro",
    images: [
      {
        url: "https://tweetmaestro.com/images/craft.png",
        width: 1200,
        height: 630,
        alt: "Tweet Maestro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweet Maestro",
    description: "Plan and execute your ideal Twitter strategy.",
    images: ["https://tweetmaestro.com/images/craft.png"],
    creator: "@braedenhall_",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
