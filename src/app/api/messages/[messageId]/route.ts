import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { assertMessageAccess } from "@/lib/conversation-utils";

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

    await assertMessageAccess(messageId, user.id);

    await db.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return successResponse({ message: "Message deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const body = await request.json();

    const { content } = body;
    if (!content || typeof content !== "string" || !content.trim()) {
      throw new ValidationError("Content is required", { content: ["Required"] });
    }

    if (content.trim().length > 5000) {
      throw new ValidationError("Content too long", { content: ["Max 5000 characters"] });
    }

    const message = await db.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, deletedAt: true },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId !== user.id) {
      throw new ForbiddenError("You can only edit your own messages");
    }

    if (message.deletedAt) {
      throw new ForbiddenError("Cannot edit a deleted message");
    }

    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { content: content.trim(), isEdited: true },
    });

    return successResponse(updatedMessage);
  } catch (error) {
    return errorResponse(error);
  }
}
