"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/use-socket";
import { useNotificationStore } from "@/stores/notification-store";
import { playNotificationSound } from "@/lib/notification-sound";

function showBrowserNotification(title: string, body: string, url: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon-192x192.svg",
      badge: "/icons/icon-72x72.svg",
      tag: "couple-chat",
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
      n.close();
    };
  } catch {
    // Notification API not available (e.g. iOS Safari)
  }
}

export function NotificationListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const fetchDoneRef = useRef(false);
  const notifPermissionRef = useRef<NotificationPermission>("default");

  // Request browser notification permission once
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        notifPermissionRef.current = perm;
      });
    } else {
      notifPermissionRef.current = Notification.permission;
    }
  }, []);

  const handleNewNotification = useCallback((notification: unknown) => {
    const n = notification as { id: string; type: string; title: string; message: string; link: string | null; read: boolean; createdAt: string };
    addNotification(n);
    if (!n.read) incrementUnread();

    // Play sound
    playNotificationSound();

    // Show browser popup if page is not focused
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
