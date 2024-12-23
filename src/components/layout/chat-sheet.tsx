import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatPromptType } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

interface ChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  handle: string;
}

export function ChatSheet({ isOpen, onClose, onComplete, handle }: ChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId] = useState(() => uuidv4());
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  // const loadHistory = async () => {
  //   try {
  //     const response = await fetch(`/api/chat/history?handle=${handle}&type=${ChatPromptType.AudienceInitialize}`);
  //     if (response.ok) {
  //       const history = await response.json();
  //       setMessages(history.messages);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load chat history:", error);
  //   }
  // };

  // loadHistory();

  const handleSubmit = useCallback(
    async (firstMessage: boolean = false) => {
      let msgs = messages;

      if (!firstMessage) {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
          id: Date.now().toString(),
          content: input,
          role: "user",
        };

        msgs = [...msgs, userMessage];
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
      }

      setIsLoading(true);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        role: "assistant",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs.map(({ content, role }) => ({ content, role })),
            type: ChatPromptType.AudienceInitializeChat,
            user: {
              handle,
              id: session?.user.id,
            },
            chatId,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        let content = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          content += text;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = content;
            return newMessages;
          });
          const complete = content.split("<complete>")[1]?.split("</complete>")[0];
          if (complete === "True") {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: msgs.map(({ content, role }) => ({ content, role })),
                type: ChatPromptType.AudienceInitialize,
                user: {
                  handle,
                  id: session?.user.id,
                },
                chatId,
              }),
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const analysis = await response.json();
            console.log(analysis);

            onComplete();
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, input, isLoading, handle, chatId, onComplete, session?.user.id],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleSubmit(true);
    }
  }, [isOpen, messages, handleSubmit]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[500px] md:w-[600px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Define Your Target Audience</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-5rem)]">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary/80 text-primary-foreground ml-4 max-w-[80%]"
                        : "bg-muted mr-4"
                    }`}
                  >
                    {message.role === "user"
                      ? message.content
                      : message.content.split("<response>")[1]?.split("</response>")[0] || "..."}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex flex-col gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px]"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button onClick={() => handleSubmit(false)} className="w-full" disabled={isLoading}>
                {isLoading ? "Thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
