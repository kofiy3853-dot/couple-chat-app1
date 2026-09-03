import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ForbiddenError, ValidationError } from "@/lib/errors";

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  try {
    const user = await requireAuth();

    // 1. Couple conversation (the private 1-to-1)
    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
      select: { coupleId: true },
    });

    const coupleConversationPromise = coupleMember
      ? db.conversation.findUnique({
          where: { coupleId: coupleMember.coupleId },
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                sender: { select: { id: true, name: true, username: true } },
              },
            },
            couple: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, username: true, image: true },
                    },
                  },
                },
              },
            },
          },
        })
      : Promise.resolve(null);

    // 2. Group conversations via ConversationParticipant
    const groupConversationsPromise = db.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                sender: { select: { id: true, name: true, username: true } },
              },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, image: true },
                },
              },
            },
          },
        },
      },
    });

    const [coupleConversation, groupParticipations] = await Promise.all([
      coupleConversationPromise,
      groupConversationsPromise,
    ]);

    const conversations = [];

    if (coupleConversation) {
      conversations.push({
        ...coupleConversation,
        isGroup: false,
        lastMessage: coupleConversation.messages[0] ?? null,
        members: coupleConversation.couple?.members.map((m) => m.user) ?? [],
      });
    }

    for (const p of groupParticipations) {
      const conv = p.conversation;
      conversations.push({
        ...conv,
        isGroup: true,
        lastMessage: conv.messages[0] ?? null,
        members: conv.participants.map((part) => part.user),
        myRole: p.role,
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return successResponse(conversations);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/conversations — create a group chat
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, participantIds } = body as { name: string; participantIds: string[] };

    if (!name?.trim()) throw new ValidationError("Group name is required");
    if (!Array.isArray(participantIds) || participantIds.length < 1) {
      throw new ValidationError("At least one other participant is required");
    }

    // De-dup and add creator
    const allParticipantIds = Array.from(new Set([user.id, ...participantIds]));

    // Verify all users exist
    const users = await db.user.findMany({
      where: { id: { in: allParticipantIds } },
      select: { id: true },
    });
    if (users.length !== allParticipantIds.length) {
      throw new ValidationError("One or more users not found");
    }

    const conversation = await db.conversation.create({
      data: {
        isGroup: true,
        name: name.trim(),
        participants: {
          create: allParticipantIds.map((uid) => ({
            userId: uid,
            role: uid === user.id ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
      },
    });

    return successResponse(conversation, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
