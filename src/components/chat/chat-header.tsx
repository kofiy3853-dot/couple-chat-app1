"use client";

import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { TypingIndicator } from "./typing-indicator";
import type { PresenceStatus } from "@/lib/constants";

interface ChatHeaderProps {
  partnerName: string | null;
  partnerImage: string | null;
  connected: boolean;
  reconnectFailed: boolean;
  isPartnerTyping: boolean;
  partnerPresence: PresenceStatus;
}

function getPresenceText(presence: PresenceStatus): string {
  switch (presence) {
    case "online": return "Online";
    case "recording": return "Recording...";
    case "in-call": return "In a call";
    case "offline": return "Offline";
    default: return "Offline";
  }
}

export function ChatHeader({
  partnerName,
  partnerImage,
  connected,
  reconnectFailed,
  isPartnerTyping,
  partnerPresence,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
      <Link
        href="/"
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </Link>

      <Avatar className="h-9 w-9">
        <AvatarImage src={partnerImage || undefined} alt={partnerName || ""} />
        <AvatarFallback className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-sm font-medium">
          {getInitials(partnerName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {partnerName || "Partner"}
        </h2>
        {isPartnerTyping ? (
          <TypingIndicator />
        ) : (
          <div className="flex items-center gap-1.5">
            {reconnectFailed ? (
              <>
                <RefreshCw className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-500">Disconnected</span>
              </>
            ) : connected ? (
              <>
                <div className={`h-2 w-2 rounded-full ${
                  partnerPresence === "online" ? "bg-green-500" :
                  partnerPresence === "recording" ? "bg-yellow-500 animate-pulse" :
                  partnerPresence === "in-call" ? "bg-blue-500" :
                  "bg-gray-400"
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getPresenceText(partnerPresence)}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Connecting...</span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
