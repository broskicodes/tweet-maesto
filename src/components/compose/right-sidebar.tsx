import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useViewStore } from "@/store/views";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  Loader2,
  Plus,
  MoreHorizontal,
  Trash2,
  Info,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Draft, useDraftsStore } from "@/store/drafts";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { PricingModal } from "../layout/pricing-modal";

type TabValue = "drafts" | "scheduled" | "posted";

export const RightSidebar: FC = () => {
  const { currentView } = useViewStore();
  const { data: session } = useSession();
  const { drafts, activeDraft, isLoading, setActiveDraft, createDraft, deleteDraft } =
    useDraftsStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("drafts");
  const [showPricing, setShowPricing] = useState(false);
  const handleNewDraft = useCallback(async () => {
    if (!session?.user?.id) return;
    await createDraft([{ id: Date.now().toString(), content: "" }]);
  }, [session?.user?.id, createDraft]);

  const filteredTweets = useMemo(() => {
    return {
      drafts: drafts.filter((t) => t.status === "draft"),
      scheduled: drafts.filter((t) => t.status === "scheduled"),
      posted: drafts.filter((t) => t.status === "posted"),
    };
  }, [drafts]);

  const handleDraftClick = useCallback(
    (draft: Draft) => {
      setActiveDraft(draft);
    },
    [setActiveDraft],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent, draftId: string) => {
      e.preventDefault();
      if (deleteConfirm === draftId) {
        await deleteDraft(draftId);
        setDeleteConfirm(null);
        setOpenMenuId(null);
      } else {
        setDeleteConfirm(draftId);
        setTimeout(() => {
          setDeleteConfirm(null);
        }, 3000);
      }
    },
    [deleteDraft, setDeleteConfirm, deleteConfirm],
  );

  const renderTweets = useCallback(
    (status: "drafts" | "scheduled" | "posted") => {
      if (isLoading) {
        return (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        );
      }

      const statusTweets = filteredTweets[status];
      if (statusTweets.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No {status} found</div>;
      }

      return statusTweets.map((tweet) => (
        <div
          key={tweet.id}
          className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
            activeDraft?.id === tweet.id ? "bg-muted border-l-2 border-l-primary" : ""
          }`}
          onClick={() => handleDraftClick(tweet)}
        >
          <div
            className={`text-sm ${
              activeDraft?.id === tweet.id ? "font-semibold" : "font-medium"
            } truncate`}
          >
            {tweet.tweet_boxes[0]?.content || "Empty draft"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{new Date(tweet.updated_at).toLocaleDateString()}</span>
              {activeDraft?.id === tweet.id && (
                <span className="text-primary text-xs">• Current</span>
              )}
            </div>
            {status === "drafts" && (
              <DropdownMenu
                open={openMenuId === tweet.id}
                onOpenChange={(open) => {
                  setOpenMenuId(open ? tweet.id : null);
                  if (!open && deleteConfirm !== tweet.id) setDeleteConfirm(null);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDelete(e, tweet.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteConfirm === tweet.id ? "Confirm" : "Delete draft"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ));
    },
    [
      filteredTweets,
      isLoading,
      activeDraft,
      openMenuId,
      deleteConfirm,
      handleDelete,
      handleDraftClick,
    ],
  );

  const renderContent = useCallback(() => {
    switch (currentView) {
      case "compose":
        return (
          <>
            <SidebarHeader className="h-14 border-b px-2 flex items-center justify-between">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as TabValue);
                }}
                className="w-full"
              >
                <TabsList variant="underline" className="grid w-full grid-cols-3">
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="posted">Posted</TabsTrigger>
                </TabsList>
              </Tabs>
            </SidebarHeader>
            <SidebarContent>
              <div className="flex flex-col">
                <div
                  onClick={handleNewDraft}
                  className="p-4 border-b hover:bg-muted/50 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Create new draft
                </div>
                <ScrollArea className="h-full">
                  {activeTab === "drafts" && renderTweets("drafts")}
                  {activeTab === "scheduled" && renderTweets("scheduled")}
                  {activeTab === "posted" && renderTweets("posted")}
                </ScrollArea>
              </div>
            </SidebarContent>
            {!session?.user?.subscribed && (
              <SidebarFooter>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="p-2 text-xs text-blue-500 flex gap-1 items-center cursor-help">
                      <Info className="h-3 w-3" />
                      Your account is using the free tier
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        We will append a link to Tweet Maestro to the end of your thread.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span
                          className="text-primary cursor-pointer underline"
                          onClick={() => setShowPricing(true)}
                        >
                          Upgrade to Pro
                        </span>{" "}
                        to remove this limitation.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </SidebarFooter>
            )}
          </>
        );

      case "calendar":
        return (
          <>
            <SidebarHeader className="h-14 border-b px-4 flex items-center">
              <h3 className="font-semibold">Calendar Options</h3>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                {/* Calendar view settings */}
                <div className="p-4 space-y-4">
                  <p>Calendar filters will go here</p>
                </div>
              </SidebarGroup>
            </SidebarContent>
          </>
        );

      case "planner":
        return (
          <>
            <SidebarHeader className="h-14 border-b px-4 flex items-center">
              <h3 className="font-semibold">Planner Tools</h3>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                {/* Planner view settings */}
                <div className="p-4 space-y-4">
                  <p>Planning tools will go here</p>
                </div>
              </SidebarGroup>
            </SidebarContent>
          </>
        );
    }
  }, [currentView, activeTab, renderTweets, handleNewDraft, session]);

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <Sidebar side="right" collapsible="offcanvas" className="!absolute !h-full">
        {renderContent()}
      </Sidebar>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
};
