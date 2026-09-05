import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ValidationError, ConflictError } from "@/lib/errors";
import { createNotification } from "@/lib/notification-helpers";

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

    // Move all checks inside serializable transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      // Re-fetch and lock the invitation row
      const lockedInvitation = await tx.coupleInvitation.findUnique({
        where: { id: invitation.id },
        include: { couple: { include: { members: true } } },
      });

      if (!lockedInvitation || lockedInvitation.usedById) {
        throw new ConflictError("This invitation has already been used");
      }

      if (new Date() > lockedInvitation.expiresAt) {
        throw new ConflictError("This invitation has expired");
      }

      if (lockedInvitation.couple.members.length >= 2) {
        throw new ConflictError("This couple is already full");
      }

      // Check user isn't already in a couple
      const existingMember = await tx.coupleMember.findFirst({
        where: { userId: user.id },
      });

      if (existingMember) {
        throw new ConflictError("You are already in a couple");
      }

      await tx.coupleMember.create({
        data: {
          coupleId: lockedInvitation.coupleId,
          userId: user.id,
        },
      });

      // Check if conversation already exists for this couple
      const existingConversation = await tx.conversation.findUnique({
        where: { coupleId: lockedInvitation.coupleId },
      });

      if (!existingConversation) {
        await tx.conversation.create({
          data: {
            coupleId: lockedInvitation.coupleId,
          },
        });
      }

      await tx.coupleInvitation.update({
        where: { id: lockedInvitation.id },
        data: { usedById: user.id },
      });

      return { success: true, creatorId: lockedInvitation.creatorId };
    });

    // Notify invitation creator
    if (result.creatorId) {
      const acceptorName = user.name || user.username || "Someone";
      await createNotification({
        userId: result.creatorId,
        type: "INVITATION",
        title: "Invitation Accepted",
        message: `${acceptorName} accepted your couple invitation`,
        link: "/dashboard",
      });
    }

    return successResponse({ message: "Invitation accepted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
