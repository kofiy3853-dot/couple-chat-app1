"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/hooks/use-chat";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottomRef.current = atBottom;
      setShowScrollDown(!atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore) return;

    const handleScroll = () => {
      if (container.scrollTop < 50 && !loadingMore) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className="flex flex-col gap-1 max-w-[70%]">
              <Skeleton className="h-4 w-20" />
              <Skeleton className={`h-10 ${i % 2 === 0 ? "w-48" : "w-36"}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
      {hasMore && (
        <div className="flex justify-center py-2">
          {loadingMore ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Load older messages
            </button>
          )}
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
        </div>
      )}

      <div className="space-y-1">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showSender = !prevMessage || prevMessage.senderId !== message.senderId;

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              showSender={showSender}
              onReply={onReply}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      <div ref={bottomRef} />

      {showScrollDown && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 right-6 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}
