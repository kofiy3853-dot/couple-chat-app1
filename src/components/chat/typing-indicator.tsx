"use client";

import { Mic, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/constants";

interface TypingIndicatorProps {
  isVisible: boolean;
  partnerName?: string;
  presenceStatus?: PresenceStatus;
}

export function TypingIndicator({ isVisible, partnerName, presenceStatus }: TypingIndicatorProps) {
  const showTyping = isVisible || presenceStatus === "typing";
  const showRecording = presenceStatus === "recording";
  const showInCall = presenceStatus === "in-call";

  if (!showTyping && !showRecording && !showInCall) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 transition-opacity duration-300 opacity-100">
      {showTyping && (
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl px-4 py-2.5">
          <span className="text-sm text-gray-500">
            {partnerName ? `${partnerName} is typing` : "typing"}
          </span>
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          </span>
        </div>
      )}

      {showRecording && (
        <div className={cn(
          "flex items-center gap-2 bg-red-50 rounded-2xl px-4 py-2.5",
          "border border-red-200"
        )}>
          <Mic className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-sm text-red-600 font-medium">
            {partnerName ? `${partnerName} is recording` : "Recording audio"}
          </span>
        </div>
      )}

      {showInCall && (
        <div className={cn(
          "flex items-center gap-2 bg-purple-50 rounded-2xl px-4 py-2.5",
          "border border-purple-200"
        )}>
          <Phone className="h-4 w-4 text-purple-500" />
          <span className="text-sm text-purple-600 font-medium">
            {partnerName ? `${partnerName} is in a call` : "In a call"}
          </span>
        </div>
      )}
    </div>
  );
}
