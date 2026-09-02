"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useChatStore } from "@/stores/chat-store";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { EmptyChat } from "./empty-chat";

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
      lastSeenAt: string | null;
    };
  }[];
  conversation: {
    id: string;
  } | null;
}

interface ChatContainerProps {
  currentUserId: string;
  token: string;
  className?: string;
}

export function ChatContainer({ currentUserId, token, className }: ChatContainerProps) {
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const { onlineUsers, typingUsers } = useChatStore();

  const partner = couple?.members.find(
    (m) => m.user.id !== currentUserId
  )?.user;

  const conversationId = couple?.conversation?.id ?? null;

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    hasMore,
    sending,
    loadMore,
    sendMessage: httpSendMessage,
    deleteMessage: httpDeleteMessage,
    addReaction: httpAddReaction,
  } = useChat({
    conversationId,
    userId: currentUserId,
  });

  const {
    connected,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
  } = useSocket({
    token,
    conversationId,
    userId: currentUserId,
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

    fetchCouple();
  }, []);

  const isPartnerOnline = partner ? onlineUsers.has(partner.id) : false;
  const isPartnerTyping = partner ? typingUsers.has(partner.id) : false;

  const handleTyping = useCallback(() => {
    if (conversationId) {
      startTyping(conversationId);
    }
  }, [conversationId, startTyping]);

  const handleSend = useCallback(
    async (content: string) => {
      if (connected && conversationId) {
        wsSendMessage(conversationId, content);
      } else {
        await httpSendMessage(content);
      }
    },
    [connected, conversationId, wsSendMessage, httpSendMessage]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (connected && conversationId) {
        httpDeleteMessage(messageId);
      } else {
        await httpDeleteMessage(messageId);
      }
    },
    [connected, conversationId, httpDeleteMessage]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      return httpAddReaction(messageId, emoji);
    },
    [httpAddReaction]
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

  if (!couple || !partner || !conversationId) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
        <EmptyChat />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
      <ChatHeader
        partnerName={partner.name ?? partner.username ?? "Partner"}
        partnerImage={partner.image}
        isOnline={isPartnerOnline}
        lastSeen={partner.lastSeenAt}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={messagesLoading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        partnerName={partner.name ?? partner.username ?? undefined}
        onLoadMore={loadMore}
        onDelete={handleDelete}
        onReaction={handleReaction}
      />

      <TypingIndicator
        isVisible={isPartnerTyping}
        partnerName={partner.name?.split(" ")[0] ?? undefined}
      />

      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        sending={sending}
        conversationId={conversationId}
      />
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
