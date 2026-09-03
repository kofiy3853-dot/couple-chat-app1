import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth();
    const { conversationId } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        couple: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, username: true, image: true } },
              },
            },
          },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!conversation) throw new NotFoundError("Conversation not found");

    // Check membership — either via CoupleMember (1-to-1) or ConversationParticipant (group)
    const isCoupleConversation = !conversation.isGroup;
    let isMember = false;

    if (isCoupleConversation && conversation.couple) {
      isMember = conversation.couple.members.some((m) => m.userId === user.id);
    } else {
      isMember = conversation.participants.some((p) => p.userId === user.id);
    }

    if (!isMember) throw new ForbiddenError("You are not a member of this conversation");

    const members = isCoupleConversation
      ? conversation.couple?.members.map((m) => ({ ...m.user, role: "MEMBER" })) ?? []
      : conversation.participants.map((p) => ({ ...p.user, role: p.role }));

    return successResponse({
      ...conversation,
      members,
      lastMessage: conversation.messages[0] ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/conversations/[id] — rename group, add/remove members
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth();
    const { conversationId } = await params;
    const body = await req.json();

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) throw new NotFoundError("Conversation not found");
    if (!conversation.isGroup) throw new ForbiddenError("Cannot modify a private conversation");

    const participant = conversation.participants.find((p) => p.userId === user.id);
    if (!participant) throw new ForbiddenError("You are not a member");

    const isAdmin = participant.role === "ADMIN";

    const updates: { name?: string } = {};
    if (body.name && isAdmin) updates.name = body.name.trim();

    const updated = await db.conversation.update({
      where: { id: conversationId },
      data: updates,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
