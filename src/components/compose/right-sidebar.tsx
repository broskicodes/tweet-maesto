import { FC, useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarGroup } from "@/components/ui/sidebar";
import { useViewStore } from "@/store/views";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Calendar, Loader2, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDraftsStore } from "@/store/drafts";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Draft {
  id: string;
  tweet_boxes: { id: string; content: string }[];
  created_at: Date;
  updated_at: Date;
  status: "draft" | "scheduled" | "posted";
}

export const RightSidebar: FC = () => {
  const { currentView } = useViewStore();
  const { data: session } = useSession();
  const { drafts, activeDraft, isLoading, setActiveDraft, createDraft, deleteDraft } = useDraftsStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleNewDraft = async () => {
    if (!session?.user?.id) return;
    await createDraft(session.user.id, [{ id: Date.now().toString(), content: "" }]);
  };

  const filteredTweets = {
    drafts: drafts.filter((t) => t.status === "draft"),
    scheduled: drafts.filter((t) => t.status === "scheduled"),
    posted: drafts.filter((t) => t.status === "posted"),
  };

  const handleDraftClick = (draft: Draft) => {
    setActiveDraft(draft);
  };

  const handleDelete = async (e: React.MouseEvent, draftId: string) => {
    e.preventDefault();
    if (deleteConfirm === draftId && session?.user?.id) {
      await deleteDraft(session.user.id, draftId);
      setDeleteConfirm(null);
      setOpenMenuId(null);
    } else {
      setDeleteConfirm(draftId);
      setTimeout(() => {
        setDeleteConfirm(null);
      }, 3000);
    }
  };

  const renderTweets = (status: "drafts" | "scheduled" | "posted") => {
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
        <div className={`text-sm ${
          activeDraft?.id === tweet.id ? "font-semibold" : "font-medium"
        } truncate`}>
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
            <DropdownMenu open={openMenuId === tweet.id} onOpenChange={(open) => {
              setOpenMenuId(open ? tweet.id : null);
              if (!open && deleteConfirm !== tweet.id) setDeleteConfirm(null);
            }}>
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
  };

  const renderContent = () => {
    switch (currentView) {
      case "compose":
        return (
          <>
            <Tabs defaultValue="drafts" className="w-full">
              <SidebarHeader className="h-14 border-b px-4 flex items-center justify-between">
                <TabsList variant="underline" className="grid w-full grid-cols-3">
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="posted">Posted</TabsTrigger>
                </TabsList>
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
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <TabsContent value="drafts" className="mt-0">
                    {renderTweets("drafts")}
                  </TabsContent>
                  <TabsContent value="scheduled" className="mt-0">
                    {renderTweets("scheduled")}
                  </TabsContent>
                  <TabsContent value="posted" className="mt-0">
                    {renderTweets("posted")}
                  </TabsContent>
                </ScrollArea>
                </div>
              </SidebarContent>
            </Tabs>
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
  };

  return (
    <div className="relative h-[calc(100vh)]">
      <Sidebar side="right" collapsible="offcanvas" className="!absolute !h-full">
        {renderContent()}
      </Sidebar>
    </div>
  );
};
