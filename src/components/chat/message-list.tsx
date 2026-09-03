"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || loadingMore || !hasMore) return;

    if (container.scrollTop < 100) {
      const previousScrollHeight = container.scrollHeight;
      onLoadMore();
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, [onLoadMore, loadingMore, hasMore]);

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
          <div className="text-4xl mb-3">💌</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No messages yet. Say something special to {partnerName}!
          </p>
        </div>
      </div>
    );
  }

  const dateGroups = groupMessagesByDate(messages);

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
            {group.messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const prevMessage = group.messages[index - 1];
              const showAvatar =
                !isOwn &&
                (!prevMessage ||
                  prevMessage.senderId !== message.senderId);

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  isRead={isOwn && message.id === lastReadMessageId}
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
