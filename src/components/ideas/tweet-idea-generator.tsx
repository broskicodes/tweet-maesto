"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import posthog from "posthog-js";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface TweetIdea {
  topic: string;
  type: string;
  description: string;
  hooks: string[];
  structure: string;
  reward: string;
}

export default function TweetIdeaGenerator() {
  const { data: session, status } = useSession();
  const [twitterHandle, setTwitterHandle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [ideas, setIdeas] = useState<TweetIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState({ handle: false, audience: false });

  const handleSignIn = () => {
    posthog.capture("sign-in-clicked");
    signIn("twitter");
  };

  const generateIdeas = async () => {
    setErrors({ handle: false, audience: false });

    if (!session?.user?.handle && !twitterHandle.trim()) {
      setErrors((prev) => ({ ...prev, handle: true }));
      return;
    }
    if (!targetAudience.trim()) {
      setErrors((prev) => ({ ...prev, audience: true }));
      return;
    }

    posthog.identify(session?.user?.handle || twitterHandle);
    posthog.capture("idea-gen", { handle: session?.user?.handle || twitterHandle });
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterHandle: session?.user?.handle || twitterHandle,
          targetAudience,
          additionalInfo: additionalInfo || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate ideas");
      }

      const data = await response.json();
      console.log(data);
      setIdeas(data.ideas);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate ideas");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const handleFirstInteraction = () => {
    const hasVisited = localStorage.getItem("hasVisitedIdeaGenerator");
    if (!hasVisited) {
      setIsDialogOpen(true);
      localStorage.setItem("hasVisitedIdeaGenerator", "true");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 flex flex-col">
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-3xl font-bold text-center">Tweet Idea Generator</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Info size={16} className="text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How it works</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">1. Input Your Details</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your Twitter handle and target audience. Add any additional context about
                  your content style or preferences.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">2. Generate Ideas</h3>
                <p className="text-sm text-muted-foreground">
                  The AI will analyze your inputs to generate tweet ideas that may resonate with
                  your audience.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">3. Explore Results</h3>
                <p className="text-sm text-muted-foreground">
                  Each card shows a different possible topic for a tweet. Some information is
                  provided about possible hooks, tweet structure, and ideal value for your audience.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="w-full max-w-md mx-auto space-y-6 bg-card p-6 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="twitter-handle" className="text-sm font-medium">
              Twitter Handle
            </Label>
            {status !== "authenticated" && (
              <Button variant="link" className="h-auto p-0 text-sm" onClick={handleSignIn}>
                Sign in with Twitter
              </Button>
            )}
          </div>
          <Input
            id="twitter-handle"
            value={session?.user?.handle ? `@${session.user.handle}` : twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            onFocus={handleFirstInteraction}
            placeholder="@yourusername"
            className={`h-10 ${errors.handle ? "border-red-500 focus:ring-red-500" : ""}`}
            disabled={status === "authenticated"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-audience" className="text-sm font-medium">
            Target Audience
          </Label>
          <Input
            id="target-audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            onFocus={handleFirstInteraction}
            placeholder="e.g., Tech enthusiasts, Entrepreneurs"
            className={`h-10 ${errors.audience ? "border-red-500 focus:ring-red-500" : ""}`}
            required
          />
        </div>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-2 h-auto text-sm"
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
          >
            <span>Additional Context (Optional)</span>
            {showAdditionalInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>

          {showAdditionalInfo && (
            <Textarea
              placeholder="Add any additional context about your content, style, or preferences..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              onFocus={handleFirstInteraction}
              className="min-h-[100px] resize-none"
            />
          )}
        </div>
        <Button onClick={generateIdeas} className="w-full h-10 font-medium" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Ideas"}
        </Button>
      </div>
      {ideas.length > 0 && (
        <div className="flex-1">
          {/* Desktop view */}
          <div className="hidden md:grid gap-4 w-full">
            <div
              className={`grid ${expandedCard !== null ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-1"} gap-4 w-full h-full`}
            >
              {ideas.map((idea, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 group hover:border-primary/20 ${
                    expandedCard === index
                      ? "col-span-2 row-span-2 row-start-1"
                      : expandedCard !== null
                        ? "col-start-3"
                        : ""
                  }`}
                  onClick={() => toggleCard(index)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-normal">Topic</p>
                      <CardTitle>{idea.topic}</CardTitle>
                      <p className="text-sm font-medium">
                        Type: <span className="text-primary">{idea.type}</span>
                      </p>
                    </div>
                    <div className="text-muted-foreground">
                      {expandedCard === index ? (
                        <Minimize2
                          size={18}
                          className="group-hover:text-primary transition-colors"
                        />
                      ) : (
                        <Maximize2
                          size={18}
                          className="group-hover:text-primary transition-colors"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent
                    className={`${
                      expandedCard === index ? "block" : "hidden"
                    } space-y-2 overflow-auto h-[calc(100%-4rem)]`}
                  >
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm">{idea.description}</p>
                    </div>
                    <div>
                      <Label>Hook Options</Label>
                      <ul className="list-disc pl-4 space-y-1">
                        {idea.hooks.map((hookOption, i) => (
                          <li key={i} className="text-sm">
                            {hookOption}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <Label>Tweet Structure</Label>
                      <ReactMarkdown
                        components={{
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-6 space-y-1">{children}</ol>
                          ),
                        }}
                        className="text-sm prose dark:prose-invert prose-sm max-w-none"
                      >
                        {idea.structure}
                      </ReactMarkdown>
                    </div>
                    <div>
                      <Label>Viewer Reward</Label>
                      <p className="text-sm">{idea.reward}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {ideas.map((idea, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all duration-300 group hover:border-primary/20"
                onClick={() => toggleCard(index)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-normal">Topic</p>
                    <CardTitle>{idea.topic}</CardTitle>
                    <p className="text-sm font-medium">
                      Type: <span className="text-primary">{idea.type}</span>
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    {expandedCard === index ? (
                      <ChevronUp size={18} className="group-hover:text-primary transition-colors" />
                    ) : (
                      <ChevronDown
                        size={18}
                        className="group-hover:text-primary transition-colors"
                      />
                    )}
                  </div>
                </CardHeader>
                {expandedCard === index && (
                  <CardContent className="space-y-2">
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                    </div>
                    <div>
                      <Label>Hook Options</Label>
                      <ul className="list-disc pl-4 space-y-1">
                        {idea.hooks.map((hookOption, i) => (
                          <li key={i} className="text-sm">
                            {hookOption}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <Label>Tweet Structure</Label>
                      <ReactMarkdown className="text-sm prose dark:prose-invert prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1 [&>ul>li]:text-sm [&>ol>li]:text-sm">
                        {idea.structure}
                      </ReactMarkdown>
                    </div>
                    <div>
                      <Label>Viewer Reward</Label>
                      <p className="text-sm">{idea.reward}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
