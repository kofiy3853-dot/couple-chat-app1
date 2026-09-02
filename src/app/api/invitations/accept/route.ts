import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ValidationError, ConflictError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.code || typeof body.code !== "string") {
      throw new ValidationError("Invitation code is required", {
        code: ["Code is required"],
      });
    }

    const invitation = await db.coupleInvitation.findUnique({
      where: { code: body.code },
      include: {
        couple: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new ValidationError("Invalid invitation code", {
        code: ["Invalid code"],
      });
    }

    if (invitation.usedById) {
      throw new ConflictError("This invitation has already been used");
    }

    if (new Date() > invitation.expiresAt) {
      throw new ConflictError("This invitation has expired");
    }

    if (invitation.creatorId === user.id) {
      throw new ConflictError("You cannot accept your own invitation");
    }

    const existingMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
    });

    if (existingMember) {
      throw new ConflictError("You are already in a couple");
    }

    if (invitation.couple.members.length >= 2) {
      throw new ConflictError("This couple is already full");
    }

    await db.$transaction(async (tx) => {
      await tx.coupleMember.create({
        data: {
          coupleId: invitation.coupleId,
          userId: user.id,
        },
      });

      await tx.coupleInvitation.update({
        where: { id: invitation.id },
        data: { usedById: user.id },
      });
    });

    return successResponse({ message: "Invitation accepted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
