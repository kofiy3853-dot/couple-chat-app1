"use client";

import { useState, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useChat, type Message } from "@/hooks/use-chat";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { EmptyChat } from "./empty-chat";

interface ChatPageClientProps {
  userId: string;
  conversationId: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  partnerUserId: string | null;
}

export function ChatPageClient({
  userId,
  conversationId,
  partnerName,
  partnerImage,
  partnerUserId,
}: ChatPageClientProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    sending,
    loadMore,
    deleteMessage,
    editMessage,
    addReaction,
    addRealtimeMessage,
    markMessageDeleted,
    markMessageEdited,
    applyReactionAdded,
    applyReactionRemoved,
  } = useChat({
    conversationId,
    userId,
  });

  const handleNewMessage = useCallback(
    (message: unknown) => {
      addRealtimeMessage(message as Message);
    },
    [addRealtimeMessage]
  );

  const {
    connected,
    typingState,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
    broadcastMessageDeleted,
    broadcastMessageEdited,
    broadcastReactionToggled,
  } = useSocket({
    conversationId,
    userId,
    onNewMessage: handleNewMessage,
  });

  const handleSend = async (content: string) => {
    if (!conversationId) return;
    wsSendMessage(conversationId, content, "TEXT", replyTo?.id);
    setReplyTo(null);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!conversationId) return;
    const result = await addReaction(messageId, emoji);
    if (result.success) {
      broadcastReactionToggled(messageId, conversationId, emoji, result.removed);
    }
  };

  const handleEdit = async (messageId: string, content: string) => {
    if (!conversationId) return;
    const success = await editMessage(messageId, content);
    if (success) {
      broadcastMessageEdited(messageId, conversationId, content);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!conversationId) return;
    const success = await deleteMessage(messageId);
    if (success) {
      broadcastMessageDeleted(messageId, conversationId);
    }
  };

  if (!conversationId) {
    return <EmptyChat />;
  }

  const isPartnerTyping = partnerUserId ? (typingState[partnerUserId] ?? false) : false;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <ChatHeader
        partnerName={partnerName}
        partnerImage={partnerImage}
        connected={connected}
        isPartnerTyping={isPartnerTyping}
      />

      <MessageList
        messages={messages}
        currentUserId={userId}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onReply={setReplyTo}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MessageInput
        onSend={handleSend}
        onTypingStart={() => conversationId && startTyping(conversationId)}
        onTypingStop={() => conversationId && stopTyping(conversationId)}
        replyTo={replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.sender.name || "Someone" } : null}
        onCancelReply={() => setReplyTo(null)}
        sending={sending}
      />
    </div>
  );
}
