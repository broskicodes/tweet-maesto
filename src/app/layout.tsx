import "./globals.css";

import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tweet Maestro",
  description:
    "Analyze Twitter trends and ideas working in your niche so you can make viral content.",
  openGraph: {
    siteName: "Tweet Maestro",
    images: [
      {
        url: "https://tweetmaestro.com/images/dashboard.png",
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
    images: ["https://tweetmaestro.com/images/dashboard.png"],
    creator: "@braedenhall_",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <script async src="/tolt.js" data-tolt="ee373e8c-2535-434f-aaa9-073ccd6cc712"></script>
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable,
          fontHeading.variable,
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
