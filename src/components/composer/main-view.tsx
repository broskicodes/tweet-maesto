import { FC } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight, Twitter } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MainViewProps {
  onLeftToggle: () => void;
  onRightToggle: () => void;
}

export const MainView: FC<MainViewProps> = ({ onLeftToggle, onRightToggle }) => {
  const { data: session } = useSession();

  return (
    <section className="flex-1 h-full w-full">
      <div className="flex items-center justify-between p-2 border-b h-14">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLeftToggle}>
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRightToggle}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between h-full w-full">
        <div className="flex flex-1 h-full w-full">content</div>
        <div className="flex flex-1 h-full w-full justify-end">content</div>
      </div>

      <Dialog open={!session} modal>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Connect your Twitter account to start using Tweet Maestro
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button 
              className="flex-1" 
              onClick={() => signIn("twitter")}
            >
              <Twitter className="mr-2 h-4 w-4" />
              Sign in with Twitter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}; 