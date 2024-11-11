import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [accounts, setAccounts] = useState<SimilarAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchSimilarAccounts = useCallback(async (pageNum: number) => {
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
        setAccounts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 5);
    } catch (error) {
      console.error("Error fetching similar accounts:", error);
      }
    },
    [handle],
  );

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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Similar Accounts</CardTitle>
        <CardDescription>
          Accounts with a similar audience to @{handle}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[500px] mb-4">
          {isLoading ? (
            <div className="flex justify-center py-4">Loading...</div>
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
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 