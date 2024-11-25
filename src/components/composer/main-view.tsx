import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight, Twitter, Verified, ListPlus } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "@/components/ui/progress";

interface MainViewProps {
  onLeftToggle: () => void;
  onRightToggle: () => void;
}

interface TweetBox {
  id: string;
  content: string;
}

const MAX_CHARS = 280;

export const MainView: FC<MainViewProps> = ({ onLeftToggle, onRightToggle }) => {
  const { data: session } = useSession();
  const [tweetBoxes, setTweetBoxes] = useState<TweetBox[]>([
    { id: '1', content: '' }
  ]);

  const handleContentChange = (id: string, newContent: string) => {
    setTweetBoxes(boxes => 
      boxes.map(box => 
        box.id === id ? { ...box, content: newContent } : box
      )
    );
  };

  const addNewBox = (afterId: string) => {
    const newId = Date.now().toString();
    setTweetBoxes(boxes => {
      const index = boxes.findIndex(box => box.id === afterId);
      const newBoxes = [...boxes];
      newBoxes.splice(index + 1, 0, { id: newId, content: '' });
      return newBoxes;
    });
  };

  return (
    <section className="flex-1 h-screen w-full flex flex-col">
      <div className="flex items-center justify-between p-2 h-14 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLeftToggle}>
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRightToggle}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-4 w-full py-4 px-4">
          {tweetBoxes.map((box, index) => (
            <div key={box.id} className="w-full max-w-xl bg-card rounded-lg border shadow-sm p-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://unavatar.io/twitter/${session?.user?.handle}`} />
                  <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span className="text-base font-medium ml-2">
                    {session?.user?.name}
                  </span>
                  {session?.user?.verified && <Verified className="h-5 w-5 text-background [&>path]:fill-primary" />}
                  <span className="text-base text-muted-foreground ml-auto">
                    @{session?.user?.handle}
                  </span>
                </div>
              </div>
              <textarea 
                className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                placeholder="Start typing..."
                value={box.content}
                onChange={(e) => handleContentChange(box.id, e.target.value)}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <div className="flex items-center justify-end mt-2 gap-2">
                <div className="relative h-6 w-6">
                  <Progress 
                    value={(box.content.length / MAX_CHARS) * 100} 
                    className="h-6 w-6 rounded-full"
                    style={{
                      background: box.content.length >= MAX_CHARS ? 'rgb(239 68 68 / 0.2)' : 'rgb(63 63 70 / 0.2)'
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                    {box.content.length}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  #{index + 1}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => addNewBox(box.id)}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
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