"use client";

import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Heart,
  Camera,
  CalendarDays,
  UserPlus,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "./notifications-page";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function getIcon(type: Notification["type"]) {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "MESSAGE":
      return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
    case "REACTION":
      return <Heart className={cn(iconClass, "text-rose-500")} />;
    case "MEMORY":
      return <Camera className={cn(iconClass, "text-amber-500")} />;
    case "TIMELINE":
      return <CalendarDays className={cn(iconClass, "text-green-500")} />;
    case "INVITATION":
      return <UserPlus className={cn(iconClass, "text-purple-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-gray-500")} />;
  }
}

function getIconBg(type: Notification["type"]) {
  switch (type) {
    case "MESSAGE":
      return "bg-blue-50 dark:bg-blue-900/20";
    case "REACTION":
      return "bg-rose-50 dark:bg-rose-900/20";
    case "MEMORY":
      return "bg-amber-50 dark:bg-amber-900/20";
    case "TIMELINE":
      return "bg-green-50 dark:bg-green-900/20";
    case "INVITATION":
      return "bg-purple-50 dark:bg-purple-900/20";
    default:
      return "bg-gray-50 dark:bg-gray-800";
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();

  function handleClick() {
    onRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-xl border bg-card shadow-sm text-left transition-all duration-200",
        "hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800",
        !notification.read &&
          "border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
          getIconBg(notification.type)
        )}
      >
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
              !notification.read && "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
