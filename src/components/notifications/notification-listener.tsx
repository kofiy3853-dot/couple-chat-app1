"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/use-socket";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationListener({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const fetchDoneRef = useRef(false);

  const handleNewNotification = useCallback((notification: unknown) => {
    const n = notification as { id: string; type: string; title: string; message: string; link: string | null; read: boolean; createdAt: string };
    addNotification(n);
    if (!n.read) incrementUnread();
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
