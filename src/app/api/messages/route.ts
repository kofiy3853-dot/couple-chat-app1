import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { messageSchema } from "@/lib/validation";
import { assertConversationMember } from "@/lib/conversation-utils";
import { createNotification } from "@/lib/notification-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const conversationId = searchParams.get("conversationId");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    if (!conversationId) {
      return errorResponse(
        new ValidationError("conversationId is required", {
          conversationId: ["Required"],
        })
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        couple: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    await assertConversationMember(conversationId, user.id);

    const messages = await db.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor && !isNaN(new Date(cursor).getTime())
          ? { createdAt: { lt: new Date(cursor) } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: { select: { id: true, name: true, username: true } },
          },
        },
        reactions: {
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
        },
        attachments: true,
      },
    });

    let nextCursor: string | null = null;

    if (messages.length > limit) {
      const nextMessage = messages.pop();
      nextCursor = nextMessage!.createdAt.toISOString();
    }

    return successResponse({
      messages,
      nextCursor,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = messageSchema.safeParse(body);

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

    const { conversationId, content, type } = body as {
      conversationId: string;
      content: string;
      type?: string;
    };
    const replyToId = parsed.data.replyToId;

    if (!conversationId) {
      return errorResponse(
        new ValidationError("conversationId is required", {
          conversationId: ["Required"],
        })
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        couple: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    await assertConversationMember(conversationId, user.id);

    const messageTypeValid = (type: unknown): type is "TEXT" | "IMAGE" | "AUDIO" =>
      type === "TEXT" || type === "IMAGE" || type === "AUDIO";
    const finalType: "TEXT" | "IMAGE" | "AUDIO" = messageTypeValid(type) ? type : "TEXT";

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: parsed.data.content,
        type: finalType,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: { select: { id: true, name: true, username: true } },
          },
        },
        reactions: true,
        attachments: true,
      },
    });

    // Only send notification for couple (private) chats
    const partnerMember = conversation.couple?.members.find(
      (m: { userId: string }) => m.userId !== user.id
    );

    if (partnerMember) {
      const senderName = user.name || user.username || "Your partner";
      await createNotification({
        userId: partnerMember.userId,
        type: "MESSAGE",
        title: "New Message",
        message: `${senderName} sent you a message`,
        link: "/chat",
      });
    }

    return successResponse(message, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const messageId = searchParams.get("messageId");

    // Single message delete
    if (messageId) {
      const message = await db.message.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, conversationId: true, deletedAt: true },
      });

      if (!message) throw new NotFoundError("Message not found");
      if (message.senderId !== user.id) throw new ForbiddenError("You can only delete your own messages");
      if (message.deletedAt) return successResponse({ message: "Already deleted" });

      await assertConversationMember(message.conversationId, user.id);

      await db.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() },
      });

      return successResponse({ deleted: true });
    }

    // Bulk delete — only delete OWN messages in the conversation
    if (!conversationId) {
      return errorResponse(new ValidationError("conversationId or messageId is required", { query: ["Required"] }));
    }

    await assertConversationMember(conversationId, user.id);

    await db.message.updateMany({
      where: { conversationId, senderId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return successResponse({ cleared: true });
  } catch (error) {
    return errorResponse(error);
  }
}
