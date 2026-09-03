"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { EmptyChat } from "./empty-chat";
import { NoCoupleView } from "@/components/dashboard/no-couple-view";
import { cn } from "@/lib/utils";

interface CoupleData {
  id: string;
  members: {
    user: {
      id: string;
      name: string | null;
      username: string | null;
      email: string;
      image: string | null;
      bio: string | null;

    };
  }[];
  conversation: {
    id: string;
  } | null;
}

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const { data: session } = useSession();
  const currentUser = session?.user;

  const partnerUser = couple?.members.find(
    (m) => m.user.id !== currentUser?.id
  )?.user;

  const conversationId = couple?.conversation?.id ?? null;

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    deleteMessage,
    addReaction,
    addRealtimeMessage,
    markMessageDeleted,
    clearMessages,
  } = useChat({
    conversationId,
    userId: currentUser?.id || "",
  });

  const {
    connected,
    typingState,
    onlineState,
    startTyping,
    stopTyping,
    markAsRead,
  } = useSocket({
    conversationId,
    userId: currentUser?.id || "",
    onNewMessage: addRealtimeMessage,
    onMessageDeleted: markMessageDeleted,
  });

  useEffect(() => {
    async function fetchCouple() {
      try {
        const res = await fetch("/api/couples");
        const data = await res.json();
        if (data.success) {
          setCouple(data.data);
        }
      } catch {
        // no-op
      } finally {
        setLoading(false);
      }
    }

    if (currentUser?.id) {
      fetchCouple();
    }
  }, [currentUser?.id]);
  // Use onlineState from useSocket (plain React state) — Zustand Set doesn't reliably trigger re-renders
  const isPartnerOnline = partnerUser ? (onlineState[partnerUser.id] === true) : false;
  // Use typingState from useSocket (plain React state) — Zustand Set doesn't reliably trigger re-renders
  const isPartnerTyping = partnerUser ? (typingState[partnerUser.id] === true) : false;

  const handleTyping = useCallback(() => {
    // Send even if not connected — socket will queue or client is reconnecting
    if (conversationId) {
      startTyping(conversationId);
    }
  }, [conversationId, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (conversationId) {
      stopTyping(conversationId);
    }
  }, [conversationId, stopTyping]);

  const handleMarkRead = useCallback((lastMessageId: string) => {
    if (connected && conversationId) {
      markAsRead(conversationId, lastMessageId);
    }
    setLastReadMessageId(lastMessageId);
  }, [connected, conversationId, markAsRead]);

  const handleClearHistory = useCallback(async () => {
    if (!conversationId) return;
    await fetch(`/api/messages?conversationId=${conversationId}`, { method: "DELETE" });
    clearMessages();
  }, [conversationId, clearMessages]);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId);
    },
    [deleteMessage]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      return addReaction(messageId, emoji);
    },
    [addReaction]
  );

  if (loading) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
        <div className="animate-pulse border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className={cn("flex flex-col h-full bg-gray-50/50 dark:bg-gray-950/50 p-4 md:p-8 overflow-y-auto", className)}>
        <NoCoupleView userName={currentUser?.name?.split(" ")[0] || "there"} />
      </div>
    );
  }

  if (!partnerUser || !conversationId) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
        <EmptyChat />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
      <ChatHeader
        partnerName={partnerUser.name ?? partnerUser.username ?? "Partner"}
        partnerImage={partnerUser.image}
        isOnline={isPartnerOnline}
        lastSeen={null}
        onClearHistory={handleClearHistory}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUser?.id || ""}
        loading={messagesLoading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        partnerName={partnerUser.name ?? partnerUser.username ?? undefined}
        lastReadMessageId={lastReadMessageId}
        onLoadMore={loadMore}
        onDelete={handleDelete}
        onReaction={handleReaction}
        onMarkRead={handleMarkRead}
      />

      <TypingIndicator
        isVisible={isPartnerTyping}
        partnerName={partnerUser.name?.split(" ")[0] ?? undefined}
      />

      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        sending={sending}
        conversationId={conversationId}
      />
    </div>
  );
}