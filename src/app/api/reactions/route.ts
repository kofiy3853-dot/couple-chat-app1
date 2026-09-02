import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return errorResponse(new NotFoundError("messageId and emoji are required"));
    }

    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        conversation: {
          include: {
            couple: {
              include: {
                members: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    const isMember = message.conversation.couple.members.some(
      (m) => m.userId === user.id
    );

    if (!isMember) {
      throw new ForbiddenError("You are not a member of this conversation");
    }

    const existing = await db.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    });

    if (existing) {
      await db.messageReaction.delete({
        where: { id: existing.id },
      });
      return successResponse({ removed: true });
    }

    const reaction = await db.messageReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
    });

    return successResponse(reaction, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
