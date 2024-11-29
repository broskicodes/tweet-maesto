import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useSession } from "next-auth/react";
import { Verified, ListPlus, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Draft, MediaItem, TweetBox, useDraftsStore } from "@/store/drafts";
import { Dock, DockIcon, DockButton } from "@/components/magicui/dock";
import { Send, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMinutes, setHours, setMinutes } from "date-fns";
import { toZonedTime, format as formatTz, fromZonedTime } from "date-fns-tz";

const MAX_CHARS = 280;

export default function Composer() {
  const { data: session } = useSession();
  const { activeDraft, isLoading, isFetched, loadDrafts, updateDraft, setActiveDraft } =
    useDraftsStore();
  const [localContent, setLocalContent] = useState<TweetBox[]>([{ id: "1", content: "" }]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("12:00");

  // Only sync from activeDraft on initial load or when switching drafts
  useEffect(() => {
    if (session?.user?.id && !isFetched) {
      loadDrafts(session.user.id);
    }
  }, [session?.user?.id, isFetched, loadDrafts]);

  // Only update local content when activeDraft changes (switching drafts)
  useEffect(() => {
    if (activeDraft && !hasChanges) {
      // Don't override local changes
      setLocalContent(activeDraft.tweet_boxes);
    }
  }, [activeDraft?.id]); // Only depend on draft ID to prevent unnecessary updates

  const handleContentChange = (id: string, newContent: string) => {
    setLocalContent((prev) =>
      prev.map((box) => (box.id === id ? { ...box, content: newContent } : box)),
    );
    setHasChanges(true);
  };

  const handleMediaUpload = useCallback(async (boxId: string, files: FileList) => {
    // TODO: Upload media to s3

    const validFiles = Array.from(files).filter((file) => {
      if (file.type.startsWith("image/") && file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 5MB limit`);
        return false;
      }
      if (file.type.startsWith("video/") && file.size > 512 * 1024 * 1024) {
        toast.error(`Video ${file.name} exceeds 512MB limit`);
        return false;
      }
      return true;
    });

    const newMedia: MediaItem[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video",
      file,
    }));

    setLocalContent((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          return {
            ...box,
            media: [...(box.media || []), ...newMedia].slice(0, 4), // Twitter max 4 media items
          };
        }
        return box;
      }),
    );
    setHasChanges(true);
  }, []);

  const addNewBox = (afterId: string) => {
    const newId = Date.now().toString();
    setLocalContent((prev) => {
      const index = prev.findIndex((box) => box.id === afterId);
      const newBoxes = [...prev];
      newBoxes.splice(index + 1, 0, { id: newId, content: "" });
      return newBoxes;
    });
    setHasChanges(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      setLocalContent((prev) => {
        const newContent = prev.filter((box) => box.id !== id);
        // If array would be empty, add a new empty box
        if (newContent.length === 0) {
          return [{ id: Date.now().toString(), content: "" }];
        }
        return newContent;
      });
      setDeleteConfirm(null);
      setHasChanges(true);
    } else {
      setDeleteConfirm(id);
      // Reset confirm state after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (hasChanges && activeDraft && session?.user?.id) {
        updateDraft(activeDraft.id, localContent);
        setHasChanges(false);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [hasChanges, activeDraft?.id, localContent, session?.user?.id, updateDraft]);

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (hasChanges && activeDraft) {
        updateDraft(activeDraft.id, localContent);
      }
    };
  }, [hasChanges, activeDraft?.id, localContent, updateDraft]);

  const handlePost = async () => {
    if (!activeDraft || !session?.user?.id) return;

    try {
      setIsPosting(true);

      // Save any pending changes first
      if (hasChanges) {
        await updateDraft(activeDraft.id, localContent);
        setHasChanges(false);
      }

      // Create FormData with all media files
      const formData = new FormData();
      localContent.forEach((box) => {
        box.media?.forEach((media) => {
          if (media.file) {
            formData.append(`file-${media.id}`, media.file);
          }
        });
      });

      const response = await fetch(`/api/drafts/${activeDraft.id}/post`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to post tweets");
      setActiveDraft({ ...activeDraft, status: "posted" });
      toast.success("Posted successfully!");
    } catch (error) {
      toast.error("Failed to post tweets");
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!activeDraft || !session?.user?.id || !scheduledDate) return;

    try {
      // Save any pending changes first
      if (hasChanges) {
        await updateDraft(activeDraft.id, localContent);
        setHasChanges(false);
      }

      const [hours, minutes] = scheduleTime.split(":").map(Number);

      // Create a new date in local timezone
      const localDate = toZonedTime(
        scheduledDate,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      localDate.setHours(hours);
      localDate.setMinutes(minutes);

      // Convert to UTC for API
      const utcDate = fromZonedTime(localDate, Intl.DateTimeFormat().resolvedOptions().timeZone);

      const minScheduleTime = addMinutes(new Date(), 5);
      if (utcDate < minScheduleTime) {
        toast.error("Schedule time must be at least 5 minutes in the future");
        return;
      }

      setIsScheduling(true);
      const response = await fetch(`/api/drafts/${activeDraft.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: utcDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule tweets");
      setActiveDraft({ ...activeDraft, status: "scheduled" });
      toast.success(
        `Scheduled for ${formatTz(utcDate, "PPP 'at' p", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`,
      );
      setScheduledDate(utcDate);
      setIsCalendarOpen(false);
    } catch (error) {
      toast.error("Failed to schedule tweets");
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
  };

  const getCharCountColor = (charCount: number) => {
    if (charCount >= MAX_CHARS) return "text-destructive";
    if (charCount >= MAX_CHARS - 20) return "text-yellow-700";
    return "text-primary";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 w-full py-4 px-4">
        <div className="w-full max-w-xl bg-card rounded-lg border shadow-sm p-4 animate-pulse">
          <div className="flex items-center mb-2">
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div className="flex-1 ml-2 space-y-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 w-full h-full min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 w-full py-4 px-4">
          {localContent.map((box, index) => (
            <div key={box.id} className="w-full max-w-xl bg-card rounded-lg border shadow-sm p-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://unavatar.io/twitter/${session?.user?.handle}`} />
                  <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-base font-medium ml-2">{session?.user?.name}</span>
                  {session?.user?.verified && (
                    <Verified className="h-5 w-5 text-background [&>path]:fill-primary" />
                  )}
                  <span className="text-base text-muted-foreground">@{session?.user?.handle}</span>
                </div>
                <Button
                  variant="ghost"
                  size={deleteConfirm === box.id ? "default" : "icon"}
                  className={`rounded-full ${
                    deleteConfirm === box.id ? "text-destructive hover:text-destructive" : ""
                  }`}
                  onClick={() => handleDelete(box.id)}
                >
                  {deleteConfirm !== box.id && <X className="h-4 w-4" />}
                  {deleteConfirm === box.id && <span className="text-xs font-medium">Confirm</span>}
                </Button>
              </div>
              <textarea
                className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                placeholder="Start typing..."
                value={box.content}
                onChange={(e) => handleContentChange(box.id, e.target.value)}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              {box.media && box.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {box.media.map((item, i) => (
                    <div
                      key={item.id}
                      className={`relative ${
                        box.media?.length === 1
                          ? "col-span-2"
                          : box.media?.length === 3 && i === 0
                            ? "row-span-2"
                            : ""
                      }`}
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt=""
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover rounded-md"
                          controls
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 hover:bg-black/70"
                        onClick={() => {
                          setLocalContent((prev) =>
                            prev.map((b) =>
                              b.id === box.id
                                ? { ...b, media: b.media?.filter((m) => m.id !== item.id) }
                                : b,
                            ),
                          );
                          setHasChanges(true);
                        }}
                      >
                        <X className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-1 mt-4">
                <input
                  type="file"
                  id={`media-upload-${box.id}`}
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => e.target.files && handleMediaUpload(box.id, e.target.files)}
                />
                <div className="relative h-6 w-6">
                  <Progress
                    value={(box.content.length / MAX_CHARS) * 100}
                    className="h-6 w-6 rounded-full"
                    color={
                      box.content.length >= MAX_CHARS
                        ? "destructive"
                        : box.content.length >= MAX_CHARS - 20
                          ? "warning"
                          : "primary"
                    }
                  />
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium ${getCharCountColor(box.content.length)}`}
                  >
                    {box.content.length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground h-6 w-6 flex items-center justify-center">
                  #{index + 1}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => addNewBox(box.id)}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => document.getElementById(`media-upload-${box.id}`)?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <>
        <div className="relative sticky bottom-4 z-10">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="absolute bottom-12 left-1/2 w-0 h-0" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end" side="top" sideOffset={16}>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={
                        scheduledDate
                          ? formatTz(
                              toZonedTime(
                                scheduledDate,
                                Intl.DateTimeFormat().resolvedOptions().timeZone,
                              ),
                              "yyyy-MM-dd",
                            )
                          : ""
                      }
                      min={formatTz(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => {
                        if (e.target.value) {
                          // Create date in local timezone
                          const [year, month, day] = e.target.value.split("-").map(Number);
                          const localDate = new Date(year, month - 1, day);

                          // If there's an existing scheduled date, preserve the time
                          if (scheduledDate) {
                            localDate.setHours(scheduledDate.getHours());
                            localDate.setMinutes(scheduledDate.getMinutes());
                          }

                          setScheduledDate(localDate);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button className="w-full" onClick={handleSchedule} disabled={isScheduling}>
                  {isScheduling ? "Scheduling..." : "Schedule Tweet"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Dock>
            {/* <DockButton
              variant="ghost"
              className="bg-primary/10 hover:bg-primary/20"
              disabled={isScheduling}
              onClick={() => setIsCalendarOpen(true)}
            >
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm text-primary font-medium">
                {scheduledDate ? formatTz(toZonedTime(scheduledDate, Intl.DateTimeFormat().resolvedOptions().timeZone), "MMM d") : "Schedule"}
              </span>
            </DockButton> */}
            <DockButton
              variant="default"
              className="bg-primary hover:bg-primary/90 flex gap-2"
              onClick={handlePost}
              disabled={isPosting || isScheduling}
            >
              <Send className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm text-primary-foreground font-medium">Post</span>
            </DockButton>
          </Dock>
        </div>
      </>
    </div>
  );
}
