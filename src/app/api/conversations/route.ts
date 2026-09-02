import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
      select: { coupleId: true },
    });

    if (!coupleMember) {
      return successResponse(null);
    }

    const conversation = await db.conversation.findUnique({
      where: { coupleId: coupleMember.coupleId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return successResponse(null);
    }

    const lastMessage = conversation.messages[0] ?? null;

    return successResponse({
      ...conversation,
      lastMessage,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
