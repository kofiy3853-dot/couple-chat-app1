import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ConflictError, NotFoundError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();

    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
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
                    email: true,
                    image: true,
                    bio: true,

                  },
                },
              },
            },
            conversation: true,
          },
        },
      },
    });

    if (!coupleMember) {
      return successResponse(null);
    }

    return successResponse({
      ...coupleMember.couple,
      memberCount: coupleMember.couple.members.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    const user = await requireAuth();

    const existing = await db.coupleMember.findFirst({
      where: { userId: user.id },
    });

    if (existing) {
      throw new ConflictError("You are already in a couple");
    }

    const couple = await db.$transaction(async (tx) => {
      const newCouple = await tx.couple.create({
        data: {},
      });

      await tx.coupleMember.create({
        data: {
          coupleId: newCouple.id,
          userId: user.id,
        },
      });

      await tx.conversation.create({
        data: {
          coupleId: newCouple.id,
        },
      });

      return tx.couple.findUnique({
        where: { id: newCouple.id },
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
          conversation: true,
        },
      });
    });

    return successResponse(couple, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
