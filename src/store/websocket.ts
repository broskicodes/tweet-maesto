import { create } from "zustand";

export enum ClientMessageType {
  Scrape = "scrape",
  Followers = "followers",
  Users = "users",
}

export enum WebSocketMessageType {
  Ready = "ready",
  Success = "success",
  Error = "error",
}

export enum MessageStatus {
  Pending = "pending",
  Success = "success",
  Error = "error",
}

export interface ClientMessage {
  type: ClientMessageType;
  payload: any;
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  clientMessageType?: ClientMessageType;
  messageId?: string;
  payload: any;
}

export interface TrackedMessage {
  id: string;
  message: ClientMessage;
  status: MessageStatus;
  response?: WebSocketMessage;
  timestamp: number;
}

type WebSocketStore = {
  socket: WebSocket | null;
  status: "connecting" | "connected" | "disconnected";
  connect: () => void;
  disconnect: () => void;
  send: (data: ClientMessage) => string;
  messages: WebSocketMessage[];
  trackedMessages: Map<string, TrackedMessage>;
};

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  status: "disconnected",
  messages: [],
  trackedMessages: new Map(),

  connect: () => {
    if (get().socket?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL as string);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      // console.log(message)

      if (message.messageId) {
        set((state) => {
          const trackedMessages = new Map(state.trackedMessages);
          const tracked = trackedMessages.get(message.messageId!);

          if (tracked) {
            trackedMessages.set(message.messageId!, {
              ...tracked,
              status:
                message.type === WebSocketMessageType.Success
                  ? MessageStatus.Success
                  : MessageStatus.Error,
              response: message,
            });
          }

          return { trackedMessages };
        });
      }

      switch (message.type) {
        case WebSocketMessageType.Success:
          set({ messages: [...get().messages, message] });
          break;
        case WebSocketMessageType.Ready:
          set({ status: "connected" });
          break;
        case WebSocketMessageType.Error:
          set({ status: "disconnected" });
          console.error(message.payload);
          break;
      }
    };

    ws.onclose = () => {
      // Optional: reconnect logic here
      setTimeout(() => get().connect(), 1000);
    };

    set({ socket: ws, status: "connecting" });
  },

  disconnect: () => {
    get().socket?.close();
    set({ socket: null, status: "disconnected" });
  },

  send: (data) => {
    const messageId = crypto.randomUUID();
    const trackedMessage: TrackedMessage = {
      id: messageId,
      message: data,
      status: MessageStatus.Pending,
      timestamp: Date.now(),
    };

    set((state) => ({
      trackedMessages: new Map(state.trackedMessages).set(messageId, trackedMessage),
    }));

    get().socket?.send(JSON.stringify({ ...data, id: messageId }));
    return messageId;
  },
}));
