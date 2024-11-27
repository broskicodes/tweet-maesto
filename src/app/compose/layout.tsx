import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tweet Maestro",
  description:
    "Analyze Twitter trends and ideas working in your niche so you can make viral content.",
  openGraph: {
    siteName: "Tweet Maestro",
    images: [
      {
        url: "https://tweetmaestro.com/images/dash-stats.png",
        width: 1200,
        height: 630,
        alt: "Tweet Maestro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweet Maestro",
    description:
      "Analyze Twitter trends and ideas working in your niche so you can make viral content.",
    images: ["https://tweetmaestro.com/images/dash-stats.png"],
    creator: "@braedenhall_",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
