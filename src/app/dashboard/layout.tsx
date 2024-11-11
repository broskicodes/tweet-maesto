import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tweet Maestro",
  description: "A tool to help you find and replicate content that is working on Twitter.",
  openGraph: {
    siteName: "Tweet Maestro",
    images: [
      {
        url: "https://builderepidemic.com/images/dash-stats.png",
        width: 1200,
        height: 630,
        alt: "Tweet Maestro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweet Maestro",
    description: "A tool to help you find and replicate content that is working on Twitter.",
    images: ["https://builderepidemic.com/images/dash-stats.png"],
    creator: "@braedenhall_",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
