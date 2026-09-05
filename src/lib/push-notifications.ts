import webPush from "web-push";
import { db } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@couple-chat.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return 0;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.svg",
    badge: payload.badge || "/icons/icon-72x72.svg",
    url: payload.url || "/notifications",
    tag: "couple-chat-notification",
    renotify: true,
  });

  let sent = 0;
  const toDelete: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404 = subscription expired, 410 = subscription revoked
      if (statusCode === 404 || statusCode === 410) {
        toDelete.push(sub.id);
      }
    }
  }

  // Clean up expired subscriptions
  if (toDelete.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return sent;
}

export async function sendPushToConversation(
  conversationId: string,
  senderId: string,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      couple: { include: { members: { select: { userId: true } } } },
      participants: { select: { userId: true } },
    },
  });

  if (!conversation) return;

  const memberIds = new Set<string>();
  if (conversation.couple) {
    conversation.couple.members.forEach((m) => {
      if (m.userId !== senderId) memberIds.add(m.userId);
    });
  } else {
    conversation.participants.forEach((p) => {
      if (p.userId !== senderId) memberIds.add(p.userId);
    });
  }

  for (const userId of memberIds) {
    await sendPushNotification(userId, payload);
  }
}
