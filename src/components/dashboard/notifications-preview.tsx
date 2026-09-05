"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ArrowRight, MessageCircle, Camera, Calendar, Heart, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationPreviewItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsPreviewProps {
  unreadCount: number;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "MESSAGE":
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case "REACTION":
      return <Heart className="h-4 w-4 text-rose-500" />;
    case "MEMORY":
      return <Camera className="h-4 w-4 text-purple-500" />;
    case "TIMELINE":
      return <Calendar className="h-4 w-4 text-green-500" />;
    case "INVITATION":
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
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

export function NotificationsPreview({ unreadCount }: NotificationsPreviewProps) {
  const [notifications, setNotifications] = useState<NotificationPreviewItem[]>([]);

  useEffect(() => {
    if (unreadCount === 0) return;
    fetch("/api/notifications?limit=3")
      .then((res) => res.json())
      .then((data) => {
        setNotifications((data.data ?? []).filter((n: NotificationPreviewItem) => !n.read));
      })
      .catch(() => {});
  }, [unreadCount]);

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-rose-500" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </CardTitle>
        <Link
          href="/notifications"
          className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {unreadCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Bell className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              All caught up
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No new notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length > 0
              ? notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "/notifications"}
                    className="flex items-center gap-3 p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              : Array.from({ length: Math.min(unreadCount, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/10"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800">
                      <Bell className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        New activity
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Just now</p>
                    </div>
                  </div>
                ))}
            <Link
              href="/notifications"
              className="flex items-center justify-center gap-1 text-sm text-rose-500 hover:text-rose-600 py-2"
            >
              View all notifications
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
