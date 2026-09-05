"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MoreHorizontal, SmilePlus, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./reaction-picker";
import type { Message } from "@/hooks/use-chat";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
}

const MAX_EDIT_LENGTH = 5000;

export function MessageItem({
  message,
  isOwn,
  showSender,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isDeleted = !!message.deletedAt;

  const groupedReactions = useMemo(() => {
    return message.reactions.reduce(
      (acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
        acc[r.emoji].count++;
        acc[r.emoji].users.push(r.user.name || "Someone");
        return acc;
      },
      {} as Record<string, { emoji: string; count: number; users: string[] }>
    );
  }, [message.reactions]);

  // Auto-resize edit textarea
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [isEditing, editContent]);

  const handleEditSubmit = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== message.content && trimmed.length <= MAX_EDIT_LENGTH) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  if (isDeleted) {
    return (
      <div className={cn("flex px-4 py-1", isOwn ? "justify-end" : "justify-start")}>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          This message was deleted
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex px-4 py-1 group", isOwn ? "justify-end" : "justify-start")}
      onMouseLeave={() => { setShowActions(false); setConfirmDelete(false); }}
    >
      <div className={cn("flex gap-2 max-w-[75%]", isOwn && "flex-row-reverse")}>
        {!isOwn && showSender && (
          <Avatar className="h-7 w-7 mt-1 shrink-0">
            <AvatarImage src={message.sender.image || undefined} alt={message.sender.name || ""} />
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
          {showSender && !isOwn && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
              {message.sender.name || "Someone"}
            </span>
          )}

          {message.replyTo && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-t-lg px-3 py-1.5 max-w-full border-l-2 border-rose-300 dark:border-rose-600">
              <span className="font-medium">{message.replyTo.sender.name}</span>
              <p className="truncate">{message.replyTo.content}</p>
            </div>
          )}

          <div
            className={cn(
              "relative px-3 py-2 rounded-2xl text-sm",
              isOwn
                ? "bg-rose-500 text-white rounded-br-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md",
              message.replyTo && (isOwn ? "rounded-tr-md" : "rounded-tl-md")
            )}
          >
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-transparent border-none outline-none resize-none text-sm min-w-[200px] max-h-[120px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSubmit();
                    }
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                />
                <div className="flex items-center gap-2 justify-end">
                  <span className={cn("text-[10px]", editContent.length > MAX_EDIT_LENGTH ? "text-red-400" : "opacity-50")}>
                    {editContent.length}/{MAX_EDIT_LENGTH}
                  </span>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs opacity-70 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={!editContent.trim() || editContent === message.content || editContent.length > MAX_EDIT_LENGTH}
                    className="text-xs font-medium underline disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.type === "IMAGE" && (
                  message.attachments?.[0] ? (
                    <img
                      src={message.attachments[0].url}
                      alt={message.attachments[0].filename}
                      className="rounded-lg max-w-full mb-1"
                    />
                  ) : message.content.startsWith("data:image") ? (
                    <img
                      src={message.content}
                      alt="Shared image"
                      className="rounded-lg max-w-full mb-1"
                    />
                  ) : null
                )}
                {message.type === "AUDIO" && (
                  message.attachments?.[0] ? (
                    <audio controls src={message.attachments[0].url} className="w-full h-8" />
                  ) : message.content.startsWith("data:audio") ? (
                    <audio controls src={message.content} className="w-full h-8" />
                  ) : null
                )}
                {message.type === "TEXT" && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </>
            )}

            {message.isEdited && !isEditing && (
              <span className={cn("text-[10px]", isOwn ? "opacity-70" : "text-gray-400")}>
                edited
              </span>
            )}
          </div>

          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.values(groupedReactions).map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(message.id, r.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                    r.users.some((u) => u === (isOwn ? "You" : message.sender.name))
                      ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="text-gray-500">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>

          {showActions && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowReactionPicker(!showReactionPicker);
                }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <SmilePlus className="h-4 w-4 text-gray-400" />
              </button>

              {showReactionPicker && (
                <ReactionPicker
                  onSelect={(emoji) => onReact(message.id, emoji)}
                  onClose={() => setShowReactionPicker(false)}
                />
              )}

              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditContent(message.content);
                      setShowActions(false);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-gray-400" />
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDelete(message.id);
                          setConfirmDelete(false);
                          setShowActions(false);
                        }}
                        className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  onReply(message);
                  setShowActions(false);
                }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
