import { create } from "zustand";

export interface TweetBox {
  id: string;
  content: string;
}

export interface Draft {
  id: string;
  tweet_boxes: TweetBox[];
  created_at: Date;
  updated_at: Date;
  status: "draft" | "scheduled" | "posted";
}

interface DraftsState {
  drafts: Draft[];
  activeDraft: Draft | null;
  isLoading: boolean;
  isFetched: boolean;
  setDrafts: (drafts: Draft[]) => void;
  setActiveDraft: (draft: Draft) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFetched: (fetched: boolean) => void;
  loadDrafts: (userId: string) => Promise<void>;
  saveDraft: (userId: string, tweetBoxes: TweetBox[]) => Promise<void>;
  updateDraft: (userId: string, draftId: string, tweetBoxes: TweetBox[]) => Promise<void>;
  createDraft: (userId: string, tweetBoxes: TweetBox[]) => Promise<void>;
  deleteDraft: (userId: string, draftId: string) => Promise<void>;
}

export const useDraftsStore = create<DraftsState>((set, get) => ({
  drafts: [],
  activeDraft: null,
  isLoading: true,
  isFetched: false,

  setDrafts: (drafts) => set({ drafts }),
  setActiveDraft: (draft) => set({ activeDraft: draft }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsFetched: (fetched) => set({ isFetched: fetched }),

  loadDrafts: async (userId) => {
    const { setIsLoading, setDrafts, setActiveDraft, setIsFetched } = get();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drafts?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);

        if (data.length === 0) {
          const initialDraft = await fetch("/api/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              tweet_boxes: [{ id: "1", content: "" }],
            }),
          });
          if (initialDraft.ok) {
            const newDraft = await initialDraft.json();
            setDrafts([newDraft]);
            setActiveDraft(newDraft);
          }
        } else {
          setActiveDraft(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setIsLoading(false);
      setIsFetched(true);
    }
  },

  updateDraft: async (userId, draftId, tweetBoxes) => {
    const { drafts, setDrafts, setActiveDraft } = get();
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tweet_boxes: tweetBoxes }),
      });
      if (res.ok) {
        const updatedDraft = await res.json();
        setDrafts(drafts.map((d) => (d.id === draftId ? updatedDraft : d)));
        setActiveDraft(updatedDraft);
      }
    } catch (error) {
      console.error("Failed to update draft:", error);
    }
  },

  createDraft: async (userId, tweetBoxes) => {
    const { drafts, setDrafts, setActiveDraft } = get();
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tweet_boxes: tweetBoxes }),
      });
      if (res.ok) {
        const draft = await res.json();
        setDrafts([draft, ...drafts]);
        setActiveDraft(draft);
      }
    } catch (error) {
      console.error("Failed to create draft:", error);
    }
  },

  saveDraft: async (userId, tweetBoxes) => {
    const { activeDraft, createDraft, updateDraft } = get();
    if (activeDraft) {
      await updateDraft(userId, activeDraft.id, tweetBoxes);
    } else {
      await createDraft(userId, tweetBoxes);
    }
  },

  deleteDraft: async (userId, draftId) => {
    const { drafts, setDrafts, activeDraft, setActiveDraft } = get();
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      
      if (res.ok) {
        const newDrafts = drafts.filter(d => d.id !== draftId);
        setDrafts(newDrafts);
        
        // If we deleted the active draft, set the first available draft as active
        if (activeDraft?.id === draftId) {
          setActiveDraft(newDrafts[0] || null);
        }
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  },
}));
