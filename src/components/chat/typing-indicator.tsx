"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isVisible: boolean;
  partnerName?: string;
}

export function TypingIndicator({ isVisible, partnerName }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
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
    </div>
  );
}
