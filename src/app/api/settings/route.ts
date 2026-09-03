import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const privacySetting = await db.userPrivacySetting.findUnique({
      where: { userId: user.id },
    });

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        status: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
      include: { couple: { select: { anniversaryDate: true } } },
    });

    return successResponse({
      profile,
      privacy: privacySetting ?? {
        showOnlineStatus: true,
        showLastSeen: true,
        readReceipts: true,
      },
      notifications: {
        messageNotifications: privacySetting?.messageNotifications ?? true,
        reactionNotifications: privacySetting?.reactionNotifications ?? true,
        invitationNotifications: privacySetting?.invitationNotifications ?? true,
        memoryNotifications: privacySetting?.memoryNotifications ?? true,
      },
      couple: {
        anniversaryDate: coupleMember?.couple.anniversaryDate ?? null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { privacy, profile, notifications, couple } = body as {
      privacy?: { showOnlineStatus?: boolean; showLastSeen?: boolean; readReceipts?: boolean };
      profile?: { name?: string; bio?: string; image?: string };
      notifications?: { messageNotifications?: boolean; reactionNotifications?: boolean; invitationNotifications?: boolean; memoryNotifications?: boolean };
      couple?: { anniversaryDate?: string | null };
    };

    const updates: Record<string, unknown> = {};

    if (profile) {
      if (profile.name !== undefined) updates.name = profile.name;
      if (profile.bio !== undefined) updates.bio = profile.bio;
      if (profile.image !== undefined) updates.image = profile.image;

      if (Object.keys(updates).length > 0) {
        await db.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }

    if (privacy) {
      await db.userPrivacySetting.upsert({
        where: { userId: user.id },
        update: privacy,
        create: {
          userId: user.id,
          showOnlineStatus: privacy.showOnlineStatus ?? true,
          showLastSeen: privacy.showLastSeen ?? true,
          readReceipts: privacy.readReceipts ?? true,
        },
      });
    }

    if (notifications) {
      const existing = await db.userPrivacySetting.findUnique({
        where: { userId: user.id },
      });

      const notificationData = {
        showOnlineStatus: existing?.showOnlineStatus ?? true,
        showLastSeen: existing?.showLastSeen ?? true,
        readReceipts: existing?.readReceipts ?? true,
        messageNotifications: notifications.messageNotifications ?? true,
        reactionNotifications: notifications.reactionNotifications ?? true,
        invitationNotifications: notifications.invitationNotifications ?? true,
        memoryNotifications: notifications.memoryNotifications ?? true,
      };

      await db.userPrivacySetting.upsert({
        where: { userId: user.id },
        update: notificationData,
        create: {
          userId: user.id,
          ...notificationData,
        },
      });
    }

    if (couple !== undefined) {
      const coupleMember = await db.coupleMember.findFirst({
        where: { userId: user.id },
      });
      if (coupleMember) {
        await db.couple.update({
          where: { id: coupleMember.coupleId },
          data: { anniversaryDate: couple.anniversaryDate ? new Date(couple.anniversaryDate) : null },
        });
      }
    }

    return successResponse({ message: "Settings updated" });
  } catch (error) {
    return errorResponse(error);
  }
}
