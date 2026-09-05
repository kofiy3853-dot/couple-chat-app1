"use client";

import { useEffect, useRef, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";

function getIconBg(type: string) {
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

function getIcon(type: string) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "MESSAGE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      );
    case "REACTION":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      );
    case "MEMORY":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      );
    case "TIMELINE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case "INVITATION":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
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

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [isOpen, toggleOpen] = useReducer((prev: boolean) => !prev, false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fetchedRef = useRef(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications((data.data ?? []).slice(0, 10));
        }
      } catch {
        // silently fail
      }
    }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchNotifications();
    }
  }, [setNotifications]);

  async function handleMarkAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      markAsRead(id);
    } catch {
      // silently fail
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
      markAllAsRead();
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (isOpen) toggleOpen();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4.5 w-4.5 min-w-[18px] text-[10px] font-bold text-white bg-rose-500 rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      toggleOpen();
                      if (notification.link) router.push(notification.link);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      !notification.read &&
                        "bg-rose-50/30 dark:bg-rose-900/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                        getIconBg(notification.type)
                      )}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-xs font-medium text-gray-900 dark:text-gray-100 truncate",
                            !notification.read && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  toggleOpen();
                  router.push("/notifications");
                }}
                className="w-full flex items-center justify-center gap-1 p-3 text-sm text-rose-500 hover:text-rose-600 border-t font-medium"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
