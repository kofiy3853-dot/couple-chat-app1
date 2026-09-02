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
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    lastSeenAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const isMember = conversation.couple.members.some(
      (m: { userId: string }) => m.userId === user.id
    );

    if (!isMember) {
      throw new ForbiddenError("You are not a member of this conversation");
    }

    return successResponse(conversation);
  } catch (error) {
    return errorResponse(error);
  }
}
