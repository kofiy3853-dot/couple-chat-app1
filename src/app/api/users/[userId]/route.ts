import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
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

    const response: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    const privacy = user.privacySetting;
    if (privacy?.showOnlineStatus) {
      response.isOnline = false;
    }
    if (privacy?.showLastSeen) {
      response.lastSeenAt = null;
    }

    return successResponse(response);
  } catch (error) {
    return errorResponse(error);
  }
}
