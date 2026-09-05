import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { assertMessageAccess } from "@/lib/conversation-utils";

const reactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const { messageId, emoji } = parsed.data;

    await assertMessageAccess(messageId, user.id);

    // Atomic toggle: try delete first, if no rows deleted then create
    const deleted = await db.messageReaction.deleteMany({
      where: { messageId, userId: user.id, emoji },
    });

    if (deleted.count > 0) {
      return successResponse({ removed: true });
    }

    const reaction = await db.messageReaction.create({
      data: { messageId, userId: user.id, emoji },
    });

    return successResponse(reaction, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
