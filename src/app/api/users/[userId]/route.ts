import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        privacySetting: {
          select: {
            showOnlineStatus: true,
            showLastSeen: true,
            readReceipts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isOwnProfile = currentUser.id === userId;

    let isInSameCouple = false;
    if (!isOwnProfile) {
      const currentUserCouple = await db.coupleMember.findFirst({
        where: { userId: currentUser.id },
        select: { coupleId: true },
      });
      if (currentUserCouple) {
        const targetInSameCouple = await db.coupleMember.findFirst({
          where: {
            userId,
            coupleId: currentUserCouple.coupleId,
          },
        });
        isInSameCouple = !!targetInSameCouple;
      }
    }

    if (!isOwnProfile && !isInSameCouple) {
      throw new UnauthorizedError("Cannot view profiles of users outside your couple");
    }

    const response: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    const privacy = user.privacySetting;
    if (privacy?.showOnlineStatus || isOwnProfile) {
      response.isOnline = false;
    }

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
}
