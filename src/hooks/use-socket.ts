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
  const clientRef = useRef<WebSocketClient | null>(null);
  const { addMessage, removeMessage, setTypingUser, setOnlineUser } = useChatStore();

  useEffect(() => {
    if (!userId) return; // Don't connect if we don't have a user yet

    const client = WebSocketClient.getInstance({ userId });
    clientRef.current = client;

    const unsubConnected = client.on("connected", () => setConnected(true));
    const unsubDisconnected = client.on("disconnected", () => setConnected(false));

    const unsubOnline = client.on("user-online", (data: { userId: string }) => {
      setOnlineUser(data.userId, true);
    });

    const unsubOffline = client.on("user-offline", (data: { userId: string }) => {
      setOnlineUser(data.userId, false);
    });

    const unsubTypingStart = client.on("typing-start", (data: { userId: string }) => {
      if (data.userId !== userId) {
        setTypingUser(data.userId, true);
      }
    });

    const unsubTypingStop = client.on("typing-stop", (data: { userId: string }) => {
      if (data.userId !== userId) {
        setTypingUser(data.userId, false);
      }
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
      unsubTypingStart();
      unsubTypingStop();
      unsubNewMessage();
      unsubMessageDeleted();

      if (conversationId) {
        client.leaveConversation(conversationId);
      }
      client.disconnect();
      WebSocketClient.destroyInstance();
      setConnected(false);
    };
  }, [userId, addMessage, removeMessage, setTypingUser, setOnlineUser]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !conversationId) return;

    client.joinConversation(conversationId);

    return () => {
      client.leaveConversation(conversationId);
    };
  }, [conversationId]);

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
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    removeReaction,
    deleteMessage,
    markAsRead,
  };
}