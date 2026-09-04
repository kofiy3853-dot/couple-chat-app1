"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/hooks/use-chat";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  partnerName?: string;
  lastReadMessageId?: string | null;
  onLoadMore?: () => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onMarkRead?: (lastMessageId: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

function getDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];

  for (const message of messages) {
    const messageDate = new Date(message.createdAt);

    if (groups.length === 0 || !isSameDay(new Date(groups[groups.length - 1].date), messageDate)) {
      groups.push({
        date: message.createdAt,
        messages: [message],
      });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  }

  return groups;
}

export function MessageList({
  messages,
  currentUserId,
  loading,
  loadingMore,
  hasMore,
  partnerName,
  lastReadMessageId,
  onLoadMore,
  onDelete,
  onReaction,
  onMarkRead,
  onReply,
  onEdit,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const savedScrollRef = useRef<number | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || loadingMore || !hasMore) return;

    if (container.scrollTop < 100) {
      savedScrollRef.current = container.scrollHeight - container.scrollTop;
      loadingMoreRef.current = true;
      onLoadMore();
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, [onLoadMore, loadingMore, hasMore]);

  // Restore scroll position after load-more completes
  useEffect(() => {
    if (!loadingMoreRef.current || loadingMore) return;
    loadingMoreRef.current = false;

    const container = containerRef.current;
    if (container && savedScrollRef.current !== null) {
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - savedScrollRef.current!;
          savedScrollRef.current = null;
        }
      });
    }
  }, [loadingMore, messages.length]);

  // Compute read receipt index
  const lastReadIndex = lastReadMessageId
    ? messages.findIndex((m) => m.id === lastReadMessageId)
    : -1;

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (shouldAutoScroll && messages.length > prevMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, shouldAutoScroll]);

  // Mark messages as read when scrolled to bottom
  useEffect(() => {
    if (!onMarkRead || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUserId && shouldAutoScroll) {
      onMarkRead(lastMsg.id);
    }
  }, [messages, currentUserId, shouldAutoScroll, onMarkRead]);

  useEffect(() => {
    if (hasMessages && !loading) {
      bottomRef.current?.scrollIntoView();
    }
  }, [hasMessages, loading]);

  const dateGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn("flex gap-2", i % 2 === 0 ? "justify-start" : "justify-end")}
          >
            {i % 2 !== 0 && <div className="w-8" />}
            <div className="flex flex-col gap-1 max-w-[70%]">
              <Skeleton
                className={cn(
                  "h-10 rounded-2xl",
                  i % 2 === 0 ? "w-48 rounded-bl-md" : "w-36 rounded-br-md bg-rose-200"
                )}
              />
              <Skeleton className="h-3 w-12" />
            </div>
            {i % 2 === 0 && <div className="w-8" />}
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 mb-4 mx-auto">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No messages yet. Say something special to {partnerName}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
    >
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {dateGroups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center justify-center my-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {getDateLabel(group.date)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {group.messages.map((message, _index) => {
              const isOwn = message.senderId === currentUserId;
              const prevMessage = _index > 0 ? group.messages[_index - 1] : null;
              const showAvatar =
                !isOwn &&
                (!prevMessage ||
                  prevMessage.senderId !== message.senderId);

              // Use global message index for read receipt, not group-local index
              const globalIndex = messages.findIndex((m) => m.id === message.id);

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  isRead={isOwn && globalIndex >= 0 && lastReadIndex >= 0 && globalIndex <= lastReadIndex}
                  onDelete={onDelete}
                  onReaction={onReaction}
                  onReply={onReply}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
