"use client";

import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PersonalDashboard } from "@/components/dashboard/personal-dashboard";
import { TweetDashboard } from "@/components/dashboard/tweet-dashboard";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PricingModal } from "@/components/layout/pricing-modal";
import posthog from "posthog-js";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative">
      <main className="flex-1 flex flex-col h-screen w-full bg-background">
        <Header />
        {!session && (
          <div className="flex justify-center items-center h-full flex-1">
            <div className="flex flex-col items-center gap-4 h-full justify-center">
              <span className="text-lg font-semibold">
                {"You're not signed in."}
              </span>
              <Button onClick={() => router.push("/")}>
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Button>
            </div>
          </div>
        )}
        {session && (
          <div className="container mx-auto py-6">
            <Tabs 
              value={activeTab}
              className="w-full"
              onValueChange={(value) => {
                if (value === "tweets" && !session?.user?.subscribed) {
                  posthog.capture("upgrade-popup", {
                    trigger: "viral-tab"
                  });
                  setShowPricing(true);
                  return;
                }
                setActiveTab(value);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="personal">Personal Dashboard</TabsTrigger>
                <TabsTrigger value="tweets">Latest Viral Tweets</TabsTrigger>
              </TabsList>
              <TabsContent value="personal">
                <PersonalDashboard />
              </TabsContent>
              <TabsContent value="tweets">
                <TweetDashboard />
              </TabsContent>
            </Tabs>
          </div>
        )}
        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      </main>
      <Footer />
    </div>
  );
}
