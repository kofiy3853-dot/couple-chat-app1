"use client";

import { memo, useState } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Trash2, Pencil, Reply, Copy } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./reaction-picker";
import type { Message } from "@/hooks/use-chat";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  showAvatar?: boolean;
  isRead?: boolean;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "h:mm a");
}

function MessageItemInner({
  message,
  isOwn,
  currentUserId,
  showAvatar = false,
  isRead = false,
  onDelete,
  onReaction,
  onReply,
  onEdit,
}: MessageItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const isDeleted = message.deletedAt !== null;
  const isImage = message.type === "IMAGE" && message.attachments?.length > 0;
  const imageUrl = isImage ? message.attachments[0].url : null;

  const reactionsByEmoji = message.reactions.reduce<
    Record<string, { count: string[]; hasOwn: boolean }>
  >((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: [], hasOwn: false };
    }
    acc[reaction.emoji].count.push(reaction.userId);
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].hasOwn = true;
    }
    return acc;
  }, {});

  return (
    <div
      className={cn(
        "flex gap-2 px-4 group",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.image ?? undefined} />
              <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                {getInitials(message.sender.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[75%] min-w-0",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2.5 break-words",
            isOwn
              ? "bg-rose-500 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md",
            isDeleted && "opacity-60"
          )}
        >
          {message.replyTo && !isDeleted && (
            <div
              className={cn(
                "mb-2 pl-3 py-1 border-l-2 text-xs opacity-75 relative rounded-sm bg-black/5 dark:bg-white/5",
                isOwn ? "border-white/50" : "border-gray-400 dark:border-gray-500"
              )}
            >
              <div className="font-semibold mb-0.5 truncate">
                {message.replyTo.sender.name || message.replyTo.sender.username}
              </div>
              <div className="truncate">
                {message.replyTo.content || "Image"}
              </div>
            </div>
          )}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 text-sm italic opacity-60">
              <Trash2 className="h-3.5 w-3.5" />
              <span>This message was deleted</span>
            </div>
          ) : isImage && imageUrl ? (
            <div
              className="cursor-pointer"
              onClick={() => window.open(imageUrl, "_blank")}
            >
              {!imageLoaded && (
                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              )}
              <Image
                src={imageUrl}
                alt="Shared image"
                width={280}
                height={300}
                className={cn(
                  "max-w-[280px] max-h-[300px] rounded-lg object-cover",
                  imageLoaded ? "block" : "hidden"
                )}
                onLoad={() => setImageLoaded(true)}
                unoptimized
              />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatMessageTime(message.createdAt)}
            {message.isEdited && <span className="ml-1 italic">(edited)</span>}
          </span>

          {isOwn && !isDeleted && (
            <span className={isRead ? "text-rose-400" : "text-gray-400"}>
              {isRead ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>

        {!isDeleted && Object.keys(reactionsByEmoji).length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1 mt-1",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            {Object.entries(reactionsByEmoji).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReaction?.(message.id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                  data.hasOwn
                    ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span>{emoji}</span>
                <span className="text-gray-500 dark:text-gray-400">{data.count.length}</span>
              </button>
            ))}
          </div>
        )}

        {!isDeleted && (
          <div
            className={cn(
              "flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              isOwn ? "flex-row-reverse" : "flex-row"
            )}
          >
            <ReactionPicker
              onSelect={(emoji) => onReaction?.(message.id, emoji)}
            />
            {onReply && (
              <button
                onClick={() => onReply(message.id)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Reply"
              >
                <Reply className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            {isOwn && message.type === "TEXT" && onEdit && (
              <button
                onClick={() => onEdit(message.id)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageItem = memo(MessageItemInner, (prev, next) =>
  prev.message.id === next.message.id &&
  prev.message.content === next.message.content &&
  prev.message.isEdited === next.message.isEdited &&
  prev.message.deletedAt === next.message.deletedAt &&
  prev.message.reactions.length === next.message.reactions.length &&
  prev.isOwn === next.isOwn &&
  prev.isRead === next.isRead &&
  prev.showAvatar === next.showAvatar &&
  prev.currentUserId === next.currentUserId
);
