import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

const PREF_MAP: Record<NotificationType, string> = {
  MESSAGE: "messageNotifications",
  REACTION: "reactionNotifications",
  INVITATION: "invitationNotifications",
  MEMORY: "memoryNotifications",
  TIMELINE: "timelineNotifications",
};

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const prefField = PREF_MAP[params.type];
    const settings = await db.userPrivacySetting.findUnique({
      where: { userId: params.userId },
      select: { [prefField]: true },
    });

    if (settings && !(settings as Record<string, boolean>)[prefField]) {
      return false;
    }

    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
      },
    });
    return true;
  } catch (error) {
    console.error("[Notification] createNotification error:", error);
    return false;
  }
}

export async function createNotificationMany(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<number> {
  if (userIds.length === 0) return 0;

  const prefField = PREF_MAP[type];
  const settings = await db.userPrivacySetting.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, [prefField]: true },
  });

  const enabledUserIds = userIds.filter((uid) => {
    const s = settings.find((st) => st.userId === uid);
    if (s && !(s as Record<string, boolean>)[prefField]) return false;
    return true;
  });

  if (enabledUserIds.length === 0) return 0;

  const result = await db.notification.createMany({
    data: enabledUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link: link ?? null,
    })),
  });

  return result.count;
}
