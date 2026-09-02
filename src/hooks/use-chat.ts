"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface MessageSender {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "TEXT" | "IMAGE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
  reactions: MessageReaction[];
  attachments: { id: string; url: string; filename: string; mimeType: string; size: number }[];
}

interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

interface UseChatOptions {
  conversationId: string | null;
  userId: string;
}

export function useChat({ conversationId, userId }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(() => !!conversationId);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchMessages = useCallback(
    async (cursorParam?: string | null, prepend = false) => {
      if (!conversationId) return;

      const params = new URLSearchParams({
        conversationId,
        limit: "50",
      });
      if (cursorParam) {
        params.set("cursor", cursorParam);
      }

      const res = await fetch(`/api/messages?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const result: MessagesResponse = data.data;
        if (prepend) {
          setMessages((prev) => [...result.messages, ...prev]);
        } else {
          const sorted = [...result.messages].reverse();
          setMessages(sorted);
          if (sorted.length > 0) {
            lastMessageIdRef.current = sorted[sorted.length - 1].id;
          }
        }
        setCursor(result.nextCursor);
        setHasMore(result.nextCursor !== null);
        setLoading(false);
      }
    },
    [conversationId]
  );

  const pollMessages = useCallback(async () => {
    if (!conversationId) return;

    const params = new URLSearchParams({
      conversationId,
      limit: "50",
    });

    const res = await fetch(`/api/messages?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      const result: MessagesResponse = data.data;
      const latestMessages = result.messages;

      setMessages((prev) => {
        if (prev.length === 0) return latestMessages;

        const prevIds = new Set(prev.map((m) => m.id));
        const newMessages = latestMessages.filter((m: Message) => !prevIds.has(m.id));

        if (newMessages.length === 0) return prev;

        const updatedIds = new Set(newMessages.map((m) => m.id));
        const kept = prev.filter((m) => !updatedIds.has(m.id));

        return [...kept, ...newMessages];
      });
    }
  }, [conversationId]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(null, false);

    pollRef.current = setInterval(() => {
      pollMessages();
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [conversationId, fetchMessages, pollMessages]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    await fetchMessages(cursor, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, type: "TEXT" | "IMAGE" = "TEXT") => {
      if (!conversationId || !content.trim()) return null;

      setSending(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content, type }),
        });

        const data = await res.json();
        if (data.success) {
          const newMessage: Message = data.data;
          setMessages((prev) => [...prev, newMessage]);
          lastMessageIdRef.current = newMessage.id;
          return newMessage;
        }
        return null;
      } catch {
        return null;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, deletedAt: new Date().toISOString() }
            : m
        )
      );
      return true;
    }
    return false;
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });

    const data = await res.json();
    if (data.success) {
      const wasRemoved = data.data.removed;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;

          if (wasRemoved) {
            return {
              ...m,
              reactions: m.reactions.filter(
                (r) => !(r.userId === userId && r.emoji === emoji)
              ),
            };
          }

          const newReaction: MessageReaction = {
            id: `temp-${Date.now()}`,
            emoji,
            userId,
            user: { id: userId, name: null, username: null, image: null },
          };
          return { ...m, reactions: [...m.reactions, newReaction] };
        })
      );
      return true;
    }
    return false;
  }, [userId]);

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      return addReaction(messageId, emoji);
    },
    [addReaction]
  );

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
  };
}

export type { Message, MessageReaction, MessageSender };
