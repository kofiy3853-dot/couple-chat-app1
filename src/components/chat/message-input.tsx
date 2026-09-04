"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/hooks/use-voice-recorder";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onVoiceRecording?: (blob: Blob) => void;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
  sending: boolean;
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  onVoiceRecording,
  replyTo,
  onCancelReply,
  sending,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleInput = (value: string) => {
    setContent(value);

    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onVoiceRecording?.(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((p) => p + 1);
      }, 1000);
    } catch {
      // Microphone access denied
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
      chunksRef.current = [];
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
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

      <div className="flex items-end gap-2 px-4 py-3">
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
              className="text-gray-500"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={stopRecording}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500",
                  "max-h-32 overflow-y-auto"
                )}
                style={{ height: "auto", minHeight: "40px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
            </div>

            {content.trim() ? (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sending}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={startRecording}
                className="text-gray-500 hover:text-rose-500 rounded-full shrink-0"
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
