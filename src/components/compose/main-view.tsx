import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight, Twitter } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useViewStore } from "@/store/views";
import Composer from "./views/composer";
import Planner from "./views/planner";
import Calendar from "./views/calendar";
import Stats from "./views/stats";

interface MainViewProps {
  onLeftToggle: () => void;
  onRightToggle: () => void;
}

export const MainView: FC<MainViewProps> = ({ onLeftToggle, onRightToggle }) => {
  const { data: session } = useSession();
  const { currentView } = useViewStore();

  return (
    <section className="flex-1 h-[calc(100vh-3rem)] w-full flex flex-col">
      <div className="flex items-center justify-between p-2 h-14 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLeftToggle}>
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRightToggle}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex flex-col flex-1">
        {currentView === "compose" && <Composer />}
        {currentView === "calendar" && <Calendar />}
        {currentView === "planner" && <Planner />}
        {currentView === "stats" && <Stats />}
      </ScrollArea>

      <Dialog open={!session} modal>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Connect your Twitter account to start using Tweet Maestro
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button className="flex-1" onClick={() => signIn("twitter")}>
              <Twitter className="mr-2 h-4 w-4" />
              Sign in with Twitter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
