"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WebSocketClient from "@/server/websocket/client";
import { useChatStore } from "@/stores/chat-store";

interface UseSocketOptions {
  conversationId: string | null;
  userId: string;
}

export function useSocket({ conversationId, userId }: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  // Plain React state for reliable re-renders (Zustand Set mutations don't trigger re-renders)
  const [typingState, setTypingState] = useState<Record<string, boolean>>({});
  const [onlineState, setOnlineState] = useState<Record<string, boolean>>({});
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const clientRef = useRef<WebSocketClient | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const { addMessage, removeMessage, setTypingUser, setOnlineUser } = useChatStore();

  // Keep conversationIdRef in sync for use inside callbacks
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (!userId) return;

    const client = WebSocketClient.getInstance({ userId });
    clientRef.current = client;

    const unsubConnected = client.on("connected", () => {
      setConnected(true);
      // Join conversation only after confirmed connection (fixes race condition)
      if (conversationIdRef.current) {
        client.joinConversation(conversationIdRef.current);
      }
    });

    const unsubDisconnected = client.on("disconnected", () => setConnected(false));

    const unsubOnline = client.on("user-online", (data: { userId: string }) => {
      setOnlineState((prev) => ({ ...prev, [data.userId]: true }));
      setOnlineUser(data.userId, true);
    });

    const unsubOffline = client.on("user-offline", (data: { userId: string }) => {
      setOnlineState((prev) => ({ ...prev, [data.userId]: false }));
      setOnlineUser(data.userId, false);
    });

    // Server sends this snapshot of all currently-online users when we first connect
    const unsubSnapshot = client.on("online-users-snapshot", (data: { userIds: string[] }) => {
      const snapshot: Record<string, boolean> = {};
      data.userIds.forEach((id) => { snapshot[id] = true; });
      setOnlineState(snapshot);
      data.userIds.forEach((id) => setOnlineUser(id, true));
    });

    const unsubTypingStart = client.on("typing-start", (data: { userId: string }) => {
      if (data.userId === userId) return;
      // Update both local react state (for re-renders) and Zustand store
      setTypingState((prev) => ({ ...prev, [data.userId]: true }));
      setTypingUser(data.userId, true);
      // Auto-clear after 3s in case stop event is dropped
      if (typingTimers.current[data.userId]) clearTimeout(typingTimers.current[data.userId]);
      typingTimers.current[data.userId] = setTimeout(() => {
        setTypingState((prev) => ({ ...prev, [data.userId]: false }));
        setTypingUser(data.userId, false);
      }, 3000);
    });

    const unsubTypingStop = client.on("typing-stop", (data: { userId: string }) => {
      if (data.userId === userId) return;
      if (typingTimers.current[data.userId]) clearTimeout(typingTimers.current[data.userId]);
      setTypingState((prev) => ({ ...prev, [data.userId]: false }));
      setTypingUser(data.userId, false);
    });

    const unsubNewMessage = client.on("new-message", (message: unknown) => {
      addMessage(message as Parameters<typeof addMessage>[0]);
    });

    const unsubMessageDeleted = client.on("message-deleted", (data: { messageId: string }) => {
      removeMessage(data.messageId);
    });

    client.connect();

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubOnline();
      unsubOffline();
      unsubSnapshot();
      unsubTypingStart();
      unsubTypingStop();
      unsubNewMessage();
      unsubMessageDeleted();
      Object.values(typingTimers.current).forEach(clearTimeout);

      if (conversationIdRef.current) {
        client.leaveConversation(conversationIdRef.current);
      }
      client.disconnect();
      WebSocketClient.destroyInstance();
      setConnected(false);
    };
  }, [userId, addMessage, removeMessage, setTypingUser, setOnlineUser]);

  // Re-join conversation when it changes (e.g. couple first connects)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !conversationId || !connected) return;
    client.joinConversation(conversationId);
    return () => {
      client.leaveConversation(conversationId);
    };
  }, [conversationId, connected]);

  const sendMessage = useCallback(
    (conversationId: string, content: string, type: "TEXT" | "IMAGE" = "TEXT") => {
      clientRef.current?.sendMessage({ conversationId, content, type });
    },
    []
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      clientRef.current?.startTyping(conversationId);
    },
    []
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      clientRef.current?.stopTyping(conversationId);
    },
    []
  );

  const addReaction = useCallback(
    (messageId: string, conversationId: string, emoji: string) => {
      clientRef.current?.addReaction(messageId, conversationId, emoji);
    },
    []
  );

  const removeReaction = useCallback(
    (messageId: string, conversationId: string, emoji: string) => {
      clientRef.current?.removeReaction(messageId, conversationId, emoji);
    },
    []
  );

  const deleteMessage = useCallback(
    (messageId: string, conversationId: string) => {
      clientRef.current?.deleteMessage(messageId, conversationId);
    },
    []
  );

  const markAsRead = useCallback(
    (conversationId: string, lastReadMessageId: string) => {
      clientRef.current?.markAsRead(conversationId, lastReadMessageId);
    },
    []
  );

  return {
    connected,
    typingState,
    onlineState,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    deleteMessage,
    markAsRead,
  };
}