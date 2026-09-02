import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "@/lib/errors";

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

async function verifyMessageAccess(messageId: string, userId: string) {
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: {
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
    (m: { userId: string }) => m.userId === userId
  );

  if (!isMember) {
    throw new ForbiddenError("You are not a member of this conversation");
  }

  return message;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const body = await request.json();

    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(
        new ValidationError("Validation failed", fieldErrors)
      );
    }

    await verifyMessageAccess(messageId, user.id);

    const emoji = parsed.data.emoji;

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
      throw new ConflictError("You have already reacted with this emoji");
    }

    const reaction = await db.messageReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji: parsed.data.emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return successResponse(reaction, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const body = await request.json();

    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(
        new ValidationError("Validation failed", fieldErrors)
      );
    }

    await verifyMessageAccess(messageId, user.id);

    const emoji = parsed.data.emoji;

    const reaction = await db.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundError("Reaction not found");
    }

    await db.messageReaction.delete({
      where: { id: reaction.id },
    });

    return successResponse({ message: "Reaction removed" });
  } catch (error) {
    return errorResponse(error);
  }
}
