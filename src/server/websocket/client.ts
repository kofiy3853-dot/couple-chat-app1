"use client";

import { io, Socket } from "socket.io-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

interface WebSocketClientOptions {
  url?: string;
  token?: string;
  userId?: string;
}

class WebSocketClient {
  private static instance: WebSocketClient | null = null;
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private userId: string;
  private _connected = false;

  constructor(options: WebSocketClientOptions = {}) {
    this.url = options.url || process.env.NEXT_PUBLIC_WS_URL || "";
    this.userId = options.userId || "";
  }

  static getInstance(options: WebSocketClientOptions = {}): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(options);
    } else if (options.userId && options.userId !== WebSocketClient.instance.userId) {
      // User changed (e.g., re-login) — reset connection
      WebSocketClient.instance.disconnect();
      WebSocketClient.instance.userId = options.userId;
    }
    return WebSocketClient.instance;
  }

  get connected(): boolean {
    return this._connected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      path: "/api/ws",
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 10000,
      withCredentials: true,
    });

    this.socket.on("connect", () => {
      console.log("[WS Client] Connected");
      this._connected = true;
      this.reconnectAttempts = 0;
      this.emit("connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[WS Client] Disconnected:", reason);
      this._connected = false;
      this.emit("disconnected", reason);
      if (reason !== "io client disconnect") {
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect_error", (err) => {
      console.error("[WS Client] Connection error:", err.message);
      this._connected = false;
      this.scheduleReconnect();
    });

    // Forward all server events to registered listeners
    const events = [
      "new-message",
      "message-sent",
      "message-delivered",
      "messages-read",
      "typing-start",
      "typing-stop",
      "recording-start",
      "recording-stop",
      "call-start",
      "call-end",
      "reaction-added",
      "reaction-removed",
      "message-deleted",
      "message-edited",
      "user-online",
      "user-offline",
      "presence-snapshot",
      "game-challenge-received",
      "game-choice-made",
      "game-question-received",
      "game-answer-result",
      "game-ended",
      "error",
    ];

    events.forEach((event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket!.on(event, (...args: any[]) => {
        this.emit(event, ...args);
      });
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.socket?.disconnect();
    this.socket = null;
    this._connected = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WS Client] Max reconnection attempts reached");
      this.emit("reconnect-failed");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.log(`[WS Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // ─── Methods ──────────────────────────────────────────────────────────────
  joinConversation(conversationId: string): void {
    this.socket?.emit("join-conversation", { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit("leave-conversation", { conversationId });
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    type?: "TEXT" | "IMAGE" | "AUDIO";
    localId?: string;
    replyToId?: string;
  }): void {
    this.socket?.emit("send-message", data);
  }

  startTyping(conversationId: string): void {
    this.socket?.emit("typing-start", { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit("typing-stop", { conversationId });
  }

  startRecording(conversationId: string): void {
    this.socket?.emit("recording-start", { conversationId });
  }

  stopRecording(conversationId: string): void {
    this.socket?.emit("recording-stop", { conversationId });
  }

  startCall(conversationId: string): void {
    this.socket?.emit("call-start", { conversationId });
  }

  endCall(conversationId: string): void {
    this.socket?.emit("call-end", { conversationId });
  }

  addReaction(messageId: string, conversationId: string, emoji: string): void {
    this.socket?.emit("reaction-added", { messageId, conversationId, emoji });
  }

  removeReaction(messageId: string, conversationId: string, emoji: string): void {
    this.socket?.emit("reaction-removed", { messageId, conversationId, emoji });
  }

  deleteMessage(messageId: string, conversationId: string): void {
    this.socket?.emit("message-deleted", { messageId, conversationId });
  }

  editMessage(messageId: string, conversationId: string, content: string): void {
    this.socket?.emit("message-edited", { messageId, conversationId, content });
  }

  markAsRead(conversationId: string, lastReadMessageId: string): void {
    this.socket?.emit("message-read", { conversationId, lastReadMessageId });
  }

  deliverMessage(messageId: string, conversationId: string): void {
    this.socket?.emit("message-delivered", { messageId, conversationId });
  }

  // ─── Game methods ──────────────────────────────────────────────────────
  emitGameStart(conversationId: string, game: string, payload?: unknown): void {
    this.socket?.emit("game-start", { conversationId, game, payload });
  }

  emitGameChoice(conversationId: string, game: string, payload: unknown): void {
    this.socket?.emit("game-choice", { conversationId, game, payload });
  }

  emitGameQuestion(conversationId: string, game: string, question: string, payload?: unknown): void {
    this.socket?.emit("game-question", { conversationId, game, question, payload });
  }

  emitGameAnswer(conversationId: string, game: string, completed: boolean, payload?: unknown): void {
    this.socket?.emit("game-answer", { conversationId, game, completed, payload });
  }

  emitGameEnd(conversationId: string, game: string): void {
    this.socket?.emit("game-end", { conversationId, game });
  }

  // ─── Event emitter ──────────────────────────────────────────────────────
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  // ─── Singleton cleanup ──────────────────────────────────────────────────
  static destroyInstance(): void {
    if (WebSocketClient.instance) {
      WebSocketClient.instance.disconnect();
      WebSocketClient.instance = null;
    }
  }
}

export default WebSocketClient;