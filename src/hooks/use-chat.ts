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
  type: "TEXT" | "IMAGE" | "AUDIO";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string;
    type: "TEXT" | "IMAGE" | "AUDIO";
    sender: { id: string; name: string | null; username: string | null };
  } | null;
  sender: MessageSender;
  reactions: MessageReaction[];
  attachments: { id: string; url: string; filename: string; mimeType: string; size: number }[];
}

interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

interface ChatBroadcasters {
  newMessage?: (message: Message) => void;
  messageDeleted?: (messageId: string) => void;
  messageEdited?: (messageId: string, content: string) => void;
  reactionToggled?: (messageId: string, emoji: string, removed: boolean) => void;
}

interface IncomingReaction {
  messageId: string;
  userId: string;
  emoji: string;
  userName?: string;
}

interface UseChatOptions {
  conversationId: string | null;
  userId: string;
  broadcasters?: ChatBroadcasters;
}

export function useChat({ conversationId, userId, broadcasters }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(() => !!conversationId);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const broadcastersRef = useRef(broadcasters);

  useEffect(() => {
    broadcastersRef.current = broadcasters;
  }, [broadcasters]);

  // Expose setters for WebSocket integration
  const addRealtimeMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const markMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, deletedAt: new Date().toISOString() }
          : m
      )
    );
  }, []);

  const markMessageEdited = useCallback((messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content, isEdited: true }
          : m
      )
    );
  }, []);

  const applyReactionAdded = useCallback((reaction: IncomingReaction) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== reaction.messageId) return message;

        const alreadyExists = message.reactions.some(
          (item) => item.userId === reaction.userId && item.emoji === reaction.emoji
        );
        if (alreadyExists) return message;

        return {
          ...message,
          reactions: [
            ...message.reactions,
            {
              id: `temp-${reaction.userId}-${reaction.emoji}`,
              emoji: reaction.emoji,
              userId: reaction.userId,
              user: {
                id: reaction.userId,
                name: reaction.userName ?? null,
                username: null,
                image: null,
              },
            },
          ],
        };
      })
    );
  }, []);

  const applyReactionRemoved = useCallback((reaction: IncomingReaction) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== reaction.messageId) return message;

        return {
          ...message,
          reactions: message.reactions.filter(
            (item) => !(item.userId === reaction.userId && item.emoji === reaction.emoji)
          ),
        };
      })
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

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

      try {
        const res = await fetch(`/api/messages?${params.toString()}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
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
        }
      } catch {
        // network error
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Reset and fetch when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setMessages([]);
    setHasMore(true);
    setCursor(null);
    setLoading(true);
    fetchMessages(null, false);
  }, [conversationId, fetchMessages]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    await fetchMessages(cursor, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, type: "TEXT" | "IMAGE" = "TEXT", replyToId?: string) => {
      if (!conversationId || !content.trim()) return null;

      setSending(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content, type, replyToId }),
        });

        const data = await res.json();
        if (data.success) {
          const newMessage: Message = data.data;
          setMessages((prev) => [...prev, newMessage]);
          lastMessageIdRef.current = newMessage.id;
          broadcastersRef.current?.newMessage?.(newMessage);
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
      broadcastersRef.current?.messageDeleted?.(messageId);
      return true;
    }
    return false;
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    if (data.success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content, isEdited: true }
            : m
        )
      );
      broadcastersRef.current?.messageEdited?.(messageId, content);
      return true;
    }
    return false;
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<{ success: boolean; removed: boolean }> => {
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
      broadcastersRef.current?.reactionToggled?.(messageId, emoji, !!wasRemoved);
      return { success: true, removed: !!wasRemoved };
    }
    return { success: false, removed: false };
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
    editMessage,
    addReaction,
    removeReaction,
    addRealtimeMessage,
    markMessageDeleted,
    markMessageEdited,
    applyReactionAdded,
    applyReactionRemoved,
    clearMessages,
  };
}

export type { Message, MessageReaction, MessageSender };
