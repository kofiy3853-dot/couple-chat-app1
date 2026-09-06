"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/use-socket";
import { useNotificationStore } from "@/stores/notification-store";
import { playNotificationSound } from "@/lib/notification-sound";

function updateAppBadge(count: number) {
  // navigator.setAppBadge works on iOS PWA + Chrome
  if ("setAppBadge" in navigator) {
    try {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    } catch {
      // Not supported
    }
  }
}

async function showBrowserNotification(title: string, body: string, url: string) {
  // Try Service Worker notification first (works on mobile/PWA/iOS)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.svg",
        tag: "couple-chat",
        data: { url: url || "/notifications" },
      });
      return;
    } catch {
      // SW notification failed, fall through
    }
  }

  // Fallback to basic Notification API (desktop only)
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body,
        icon: "/icons/icon-192x192.svg",
        tag: "couple-chat",
      });
      n.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
        n.close();
      };
    } catch {
      // Not available
    }
  }
}

export function NotificationListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchDoneRef = useRef(false);

  // Update app badge when unread count changes (iOS + Chrome)
  useEffect(() => {
    updateAppBadge(unreadCount);
  }, [unreadCount]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleNewNotification = useCallback((notification: unknown) => {
    const n = notification as { id: string; type: string; title: string; message: string; link: string | null; read: boolean; createdAt: string };
    addNotification(n);
    if (!n.read) incrementUnread();

    // Play sound
    playNotificationSound();

    // Show browser popup if page is not focused or hidden
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(n.title, n.message, n.link || "/notifications");
    }
  }, [addNotification, incrementUnread]);

  useSocket({
    conversationId: null,
    userId,
    onNewNotification: handleNewNotification,
  });

  // Fetch unread count on mount
  useEffect(() => {
    if (fetchDoneRef.current || !userId) return;
    fetchDoneRef.current = true;
    fetch("/api/notifications/unread")
      .then((r) => r.json())
      .then((data) => {
        const count = data.data?.count;
        if (typeof count === "number") {
          useNotificationStore.getState().setUnreadCount(count);
        }
      })
      .catch(() => {});
  }, [userId]);

  return <>{children}</>;
}
