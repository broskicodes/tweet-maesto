"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tweet } from "@/lib/types";
import { useSession } from "next-auth/react";
import { Import, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TweetImporterProps {
  onImportSuccess: (tweets: Tweet[]) => void;
}

export function TweetImporter({ onImportSuccess }: TweetImporterProps) {
  const [tweetUrls, setTweetUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const handleImport = async () => {
    if (!session?.user?.id || !tweetUrls.trim()) return;

    setIsImporting(true);

    try {
      const urls = tweetUrls
        .split(/[,\s]+/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const response = await fetch(`${process.env.NEXT_PUBLIC_SCRAPER_URL}/twitter/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: urls,
        }),
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const data = await response.json();
      onImportSuccess(data.tweets);
      setTweetUrls("");
      setIsOpen(false);
      toast.success("Tweets imported successfully");
    } catch (error) {
      console.error("Error importing tweets:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Import className="h-4 w-4 mr-2" />
          Import Tweets
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Tweets</DialogTitle>
          <DialogDescription>Paste tweet URLs separated by commas to import them</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Textarea
            placeholder="https://twitter.com/user/status/123456789, https://twitter.com/user/status/987654321"
            value={tweetUrls}
            onChange={(e) => setTweetUrls(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleImport}
            disabled={isImporting || !tweetUrls.trim()}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Import className="mr-2 h-4 w-4" />
                Import Tweets
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
