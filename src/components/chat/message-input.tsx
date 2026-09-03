"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Smile, Loader2, X, Mic, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder, formatDuration } from "@/hooks/use-voice-recorder";
import type { Message } from "@/hooks/use-chat";

const QUICK_EMOJIS = [
  "❤️", "😍", "🥰", "😘", "💕", "🌹",
  "😊", "😂", "🤗", "😭", "🥹", "💀",
  "👍", "🙌", "👏", "🔥", "✨", "🎉",
];

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  sending?: boolean;
  conversationId?: string;
  className?: string;
  replyingToMessage?: Message | null;
  editingMessage?: Message | null;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
}

export function MessageInput({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  sending = false,
  conversationId,
  className,
  replyingToMessage,
  editingMessage,
  onCancelReply,
  onCancelEdit,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const { toast } = useToast();

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      if (!conversationId) return;

      setUploading(true);
      try {
        const tempRes = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            content: "",
            type: "AUDIO",
          }),
        });
        const tempData = await tempRes.json();
        if (tempData.success) {
          const messageId = tempData.data.id;
          const formData = new FormData();
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
          formData.append("file", file);
          formData.append("messageId", messageId);
          const attachRes = await fetch("/api/attachments", { method: "POST", body: formData });
          if (!attachRes.ok) {
            const err = await attachRes.json();
            toast({ title: "Upload failed", description: err?.error?.message || "Could not upload voice note", variant: "destructive" });
          }
        }
      } catch {
        toast({ title: "Upload failed", description: "Network error, please try again", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [conversationId, toast]
  );

  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useVoiceRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: (err) => {
      toast({ title: "Recording failed", description: err.message, variant: "destructive" });
    },
  });

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    } else {
      setContent("");
    }
  }, [editingMessage]);

  const handleSend = useCallback(async () => {
    if ((!content.trim() && !uploadFile) || sending) return;

    // Stop typing indicator when sending
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      onStopTyping?.();
    }

    if (uploadFile && conversationId) {
      setUploading(true);
      try {
        const tempRes = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            content: content.trim() || "",
            type: "IMAGE",
          }),
        });
        const tempData = await tempRes.json();
        if (tempData.success) {
          const messageId = tempData.data.id;
          const formData = new FormData();
          formData.append("file", uploadFile);
          formData.append("messageId", messageId);
          const attachRes = await fetch("/api/attachments", { method: "POST", body: formData });
          if (!attachRes.ok) {
            const err = await attachRes.json();
            toast({ title: "Upload failed", description: err?.error?.message || "Could not upload image", variant: "destructive" });
          }
        }
      } catch {
        toast({ title: "Upload failed", description: "Network error, please try again", variant: "destructive" });
      } finally {
        setUploading(false);
        setUploadFile(null);
        setUploadPreview(null);
      }
    } else {
      onSend(content.trim());
    }

    setContent("");
    setUploadFile(null);
    setUploadPreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, uploadFile, sending, onSend, onStopTyping, conversationId, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (onTyping && conversationId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        onTyping();
      }
      typingTimeoutRef.current = setTimeout(() => {
        typingActiveRef.current = false;
        onStopTyping?.();
      }, 2000);
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojis(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be 10MB or smaller", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, GIF, and WebP images are allowed", variant: "destructive" });
      e.target.value = "";
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
  };

  const isDisabled = disabled || uploading;
  const canSend = (content.trim() || uploadFile) && !sending && !disabled;

  return (
    <div className={cn("border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 relative flex flex-col", className)}>
      {(replyingToMessage || editingMessage) && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="font-medium text-rose-500 mb-0.5">
              {editingMessage ? "Editing message" : `Replying to ${replyingToMessage?.sender.name || replyingToMessage?.sender.username || "partner"}`}
            </span>
            <span className="truncate opacity-80 text-xs">
              {(editingMessage?.content || replyingToMessage?.content || (replyingToMessage?.type === "IMAGE" ? "Image" : replyingToMessage?.type === "AUDIO" ? "Voice message" : ""))}
            </span>
          </div>
          <button
            onClick={() => {
              if (editingMessage) onCancelEdit?.();
              if (replyingToMessage) onCancelReply?.();
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors ml-2 shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadPreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img
              src={uploadPreview}
              alt="Upload preview"
              className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={removeUpload}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {showEmojis && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowEmojis(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 shadow-lg">
            <div className="grid grid-cols-6 gap-2 max-w-sm mx-auto">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
        />

        {isRecording ? (
          <>
            <button
              onClick={cancelRecording}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 mb-0.5 text-red-500"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-2.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium tabular-nums">
                {formatDuration(duration)}
              </span>
              <div className="flex-1" />
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <StopCircle className="h-4 w-4" />
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 mb-0.5"
              disabled={isDisabled}
            >
              <Paperclip className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 mb-0.5"
              disabled={isDisabled}
            >
              <Smile className="h-5 w-5 text-gray-400" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                disabled={isDisabled}
                className={cn(
                  "w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                style={{ minHeight: "42px", maxHeight: "150px" }}
              />
            </div>

            {content.trim() || uploadFile ? (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 mb-0.5",
                  canSend
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-sm active:scale-95"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                )}
              >
                {sending || uploading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isDisabled}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 mb-0.5",
                  "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
