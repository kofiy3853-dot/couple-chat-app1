"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Settings, Trash2, Mic, Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/constants";

interface ChatHeaderProps {
  partnerName: string;
  partnerImage?: string | null;
  presenceStatus?: PresenceStatus;
  lastSeen?: string | null;
  onBack?: () => void;
  onClearHistory?: () => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatHeader({
  partnerName,
  partnerImage,
  presenceStatus = "offline",
  lastSeen,
  onBack,
  onClearHistory,
  className,
}: ChatHeaderProps) {
  const router = useRouter();

  const statusDotColor: Record<PresenceStatus, string> = {
    "offline": "bg-gray-300 dark:bg-gray-600",
    "online": "bg-green-500",
    "typing": "bg-blue-500",
    "recording": "bg-red-500 animate-pulse",
    "in-call": "bg-purple-500",
  };

  const statusText: Record<PresenceStatus, { text: string; className: string }> = {
    "offline": { text: "Offline", className: "text-gray-500 dark:text-gray-400" },
    "online": { text: "Online", className: "text-green-500 font-medium" },
    "typing": { text: "Typing...", className: "text-blue-500 font-medium" },
    "recording": { text: "Recording", className: "text-red-500 font-medium" },
    "in-call": { text: "In a call", className: "text-purple-500 font-medium" },
  };

  const currentStatus = statusText[presenceStatus];
  const dotColor = statusDotColor[presenceStatus];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
        className
      )}
    >
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back to dashboard"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerImage ?? undefined} />
          <AvatarFallback className="bg-rose-100 text-rose-600 font-medium">
            {getInitials(partnerName)}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950",
            dotColor
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {partnerName}
        </h3>
        <div className="flex items-center gap-1.5">
          {presenceStatus === "recording" && (
            <Mic className="h-3 w-3 text-red-500" />
          )}
          {presenceStatus === "in-call" && (
            <Phone className="h-3 w-3 text-purple-500" />
          )}
          <p className={cn("text-xs", currentStatus.className)}>
            {presenceStatus === "offline" && lastSeen
              ? `Last seen ${formatLastSeen(lastSeen)}`
              : currentStatus.text}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Chat Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {onClearHistory && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => {
                if (confirm("Clear all chat history? This cannot be undone.")) {
                  onClearHistory();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat History
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
