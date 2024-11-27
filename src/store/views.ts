import { create } from "zustand";

export type View = "compose" | "calendar" | "planner";

type ViewState = {
  currentView: View;
  setView: (view: View) => void;
};

export const useViewStore = create<ViewState>((set) => ({
  currentView: "compose",
  setView: (view) => set({ currentView: view }),
}));
