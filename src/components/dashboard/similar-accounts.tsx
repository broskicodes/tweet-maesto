import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "next-auth/react";
import { Zap } from "lucide-react";
import { PricingModal } from "@/components/layout/pricing-modal";
import { toast } from "sonner";
import { ChatSheet } from "@/components/layout/chat-sheet";
import posthog from "posthog-js";

interface SimilarAccount {
  handle: string;
  name: string;
  description: string | null;
  content_pillars: string[];
  target_audience: string;
  pfp: string | null;
  followers: number;
  similarity: number;
}

interface SimilarAccountsProps {
  handle: string;
  onAccountSelect?: (handle: string) => void;
}

export function SimilarAccounts({ handle, onAccountSelect }: SimilarAccountsProps) {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<SimilarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchSimilarAccounts = useCallback(
    async (pageNum: number) => {
      try {
        const response = await fetch("/api/profiles/similar", {
          method: "POST",
          body: JSON.stringify({ handle, page: pageNum }),
        });

        if (!response.ok) throw new Error("Failed to fetch similar accounts");

        const data = await response.json();
        if (pageNum === 0) {
          setAccounts(data);
        } else {
          setAccounts((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === 5);
      } catch (error) {
        console.error("Error fetching similar accounts:", error);
      }
    },
    [handle],
  );

  const initialize = async () => {
    setIsLoading(true);

    const response = await fetch("/api/profiles", {
      method: "POST",
      body: JSON.stringify({
        handle,
        all: false,
      }),
    });

    if (!response.ok) {
      toast.error("Failed to initialize handle");
      setIsLoading(false);
      return;
    }

    setPage(0);
    fetchSimilarAccounts(0).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setIsLoading(true);
    setPage(0);
    fetchSimilarAccounts(0).finally(() => setIsLoading(false));
  }, [fetchSimilarAccounts]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    await fetchSimilarAccounts(nextPage);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  if (!session?.user?.subscribed) {
    return (
      <>
        <Card className="h-[700px] flex flex-col">
          <CardHeader>
            <CardTitle>Similar Accounts</CardTitle>
            <CardDescription>Accounts with a similar audience to @{handle}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-center">
              Upgrade to discover accounts with similar audiences
            </p>
            <Button
              onClick={() => {
                posthog.capture("upgrade-popup", {
                  trigger: "similar-accounts",
                });
                setShowPricing(true);
              }}
              variant="default"
            >
              <Zap className="mr-2 h-4 w-4" />
              Get Access
            </Button>
          </CardContent>
        </Card>
        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      </>
    );
  }

  return (
    <>
      <Card className="h-[700px] flex flex-col">
        <CardHeader>
          <CardTitle>Similar Accounts</CardTitle>
          <CardDescription>Accounts with a similar audience to @{handle}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[570px] mb-4">
            {isLoading ? (
              <div className="flex justify-center py-4">Loading...</div>
            ) : session?.user?.handle === handle && !session?.user?.onboarded ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground text-center">
                  {"Let's craft your digital persona and determine your target audience"}
                </p>
                <Button
                  onClick={() => {
                    setIsChatOpen(true);
                  }}
                  variant="default"
                >
                  Get Started
                </Button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground text-center">
                  {"This account hasn't been initialized yet"}
                </p>
                <Button onClick={initialize} variant="default">
                  Initialize Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pr-4 pb-6">
                {accounts.map((account) => (
                  <Card
                    key={account.handle}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onAccountSelect?.(account.handle)}
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Header with profile info */}
                      <div className="flex items-center space-x-3">
                        <a
                          href={`https://twitter.com/${account.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3"
                        >
                          {account.pfp && (
                            <img
                              src={account.pfp}
                              alt={account.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{account.handle} · {account.followers.toLocaleString()} followers
                            </div>
                          </div>
                        </a>
                      </div>

                      {/* Target Audience */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Target Audience:</div>
                        <div className="text-sm text-muted-foreground">
                          {account.target_audience}
                        </div>
                      </div>

                      {/* Content Pillars */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Content Pillars:</div>
                        <div className="flex flex-wrap gap-2">
                          {account.content_pillars.map((pillar, index) => (
                            <Badge key={index} variant="secondary">
                              {pillar}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Similarity Score */}
                      <div className="text-xs text-muted-foreground text-right">
                        {(account.similarity * 100).toFixed(1)}% similar
                      </div>
                    </div>
                  </Card>
                ))}
                {hasMore && (
                  <div className="pt-2 flex justify-center">
                    <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                      {isLoadingMore ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <ChatSheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onComplete={() => {
          setIsChatOpen(false);
          toast.success("Persona generated. Loading similar accounts...");
        }}
        handle={handle}
      />
    </>
  );
}
