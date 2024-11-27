"use client";

import Footer from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import TweetIdeaGenerator from "@/components/ideas/tweet-idea-generator";

export default function IdeasPage() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative">
      <main className="flex-1 flex flex-col h-screen w-full bg-background">
        <Header />
        <div className="container mx-auto py-12">
          <div className="min-h-[400px] md:min-h-[600px]">
            <TweetIdeaGenerator />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
