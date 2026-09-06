"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_RECORDING_SECONDS = 300; // 5 minutes

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSupportedMimeType(): string {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

interface MessageInputProps {
  onSend: (content: string) => void;
  onVoiceRecording?: (blob: Blob, mimeType: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onAttachment?: (file: File) => void;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
  sending: boolean;
}

export function MessageInput({
  onSend,
  onVoiceRecording,
  onTypingStart,
  onTypingStop,
  onAttachment,
  replyTo,
  onCancelReply,
  sending,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount — stop any active recording
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleInput = (value: string) => {
    setContent(value);

    if (!typingTimeoutRef.current) {
      onTypingStart();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
      typingTimeoutRef.current = null;
    }, 2000);

    textareaRef.current?.scrollIntoView({ block: "nearest" });
  };

  const handleSend = () => {
    if (!content.trim() || sending) return;
    onSend(content.trim());
    setContent("");
    onTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cleanupRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = async () => {
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      alert("Audio recording is not supported on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onVoiceRecording?.(blob, mediaRecorder.mimeType);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((p) => {
          const next = p + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone access in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    cleanupRecording();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 safe-area-bottom">
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-0 border-l-2 border-rose-400 pl-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {replyTo.senderName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {replyTo.content}
            </p>
          </div>
          {onCancelReply && (
            <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-1.5 px-3 py-2">
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="text-gray-500 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={stopRecording}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full h-8 w-8"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onAttachment?.(file);
                  e.target.value = "";
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-rose-500 rounded-full h-9 w-9 shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500",
                  "max-h-20 overflow-y-auto"
                )}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 80) + "px";
                }}
              />
            </div>

            {content.trim() ? (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sending}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full shrink-0 h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={startRecording}
                className="text-gray-400 hover:text-rose-500 rounded-full shrink-0 h-9 w-9"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
