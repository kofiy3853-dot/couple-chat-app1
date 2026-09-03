import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertMessageAccess } from "@/lib/conversation-utils";

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});


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

    await assertMessageAccess(messageId, user.id);

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

    await assertMessageAccess(messageId, user.id);

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
