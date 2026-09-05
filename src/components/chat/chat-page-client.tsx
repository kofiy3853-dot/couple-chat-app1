"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [wsSending, setWsSending] = useState(false);

  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    deleteMessage,
    editMessage,
    addReaction,
    addRealtimeMessage,
    applyReactionAdded,
    applyReactionRemoved,
    applyMessagesRead,
    applyMessageDelivered,
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

  const handleReactionAdded = useCallback(
    (data: unknown) => {
      const d = data as { messageId: string; userId: string; emoji: string; userName?: string };
      if (d.userId === userId) return;
      applyReactionAdded(d);
    },
    [userId, applyReactionAdded]
  );

  const handleReactionRemoved = useCallback(
    (data: unknown) => {
      const d = data as { messageId: string; userId: string; emoji: string };
      if (d.userId === userId) return;
      applyReactionRemoved(d);
    },
    [userId, applyReactionRemoved]
  );

  const handleMessagesRead = useCallback(
    (data: { conversationId: string; readBy: string; lastReadMessageId: string }) => {
      applyMessagesRead(data);
    },
    [applyMessagesRead]
  );

  const {
    connected,
    reconnectFailed,
    typingState,
    presenceState,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
    broadcastMessageDeleted,
    broadcastMessageEdited,
    broadcastReactionToggled,
    markAsRead,
    markDelivered,
  } = useSocket({
    conversationId,
    userId,
    onNewMessage: handleNewMessage,
    onReactionAdded: handleReactionAdded,
    onReactionRemoved: handleReactionRemoved,
    onMessagesRead: handleMessagesRead,
  });

  // Mark messages as read when partner opens chat
  const lastReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!conversationId || !connected || loading || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === userId) return;
    if (lastReadRef.current === lastMsg.id) return;
    lastReadRef.current = lastMsg.id;
    markAsRead(conversationId, lastMsg.id);
  }, [conversationId, connected, loading, messages, userId, markAsRead]);

  // Auto-deliver incoming messages
  useEffect(() => {
    if (!conversationId || !connected) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.senderId === userId) return;
    if (lastMsg.deliveredAt) return;
    markDelivered(lastMsg.id, conversationId);
  }, [conversationId, connected, messages, userId, markDelivered]);

  const handleSend = async (content: string) => {
    if (!conversationId) return;
    setWsSending(true);
    try {
      wsSendMessage(conversationId, content, "TEXT", replyTo?.id);
      setReplyTo(null);
    } finally {
      setWsSending(false);
    }
  };

  const handleAttachment = async (file: File) => {
    if (!conversationId) return;
    setUploadError(null);
    setWsSending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const type = file.type.startsWith("audio/") ? "AUDIO" : "IMAGE";
        wsSendMessage(conversationId, data.data.url, type);
      } else {
        setUploadError(data.error?.message || "Upload failed");
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch {
      setUploadError("Upload failed. Check your connection.");
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setWsSending(false);
    }
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
    return success;
  };

  const handleDelete = async (messageId: string) => {
    if (!conversationId) return;
    const success = await deleteMessage(messageId);
    if (success) {
      broadcastMessageDeleted(messageId, conversationId);
    }
    return success;
  };

  if (!conversationId) {
    return <EmptyChat />;
  }

  const isPartnerTyping = partnerUserId ? (typingState[partnerUserId] ?? false) : false;
  const partnerPresence = partnerUserId ? (presenceState[partnerUserId] ?? "offline") : "offline";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <ChatHeader
        partnerName={partnerName}
        partnerImage={partnerImage}
        connected={connected}
        reconnectFailed={reconnectFailed}
        isPartnerTyping={isPartnerTyping}
        partnerPresence={partnerPresence}
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

      {uploadError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        onAttachment={handleAttachment}
        onTypingStart={() => conversationId && startTyping(conversationId)}
        onTypingStop={() => conversationId && stopTyping(conversationId)}
        replyTo={replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.sender.name || "Someone" } : null}
        onCancelReply={() => setReplyTo(null)}
        sending={wsSending}
      />
    </div>
  );
}
