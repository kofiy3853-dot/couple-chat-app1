import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;

    const message = await db.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, deletedAt: true },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    if (message.deletedAt) {
      return successResponse({ message: "Message already deleted" });
    }

    await db.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return successResponse({ message: "Message deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
