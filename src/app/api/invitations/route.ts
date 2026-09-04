import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ConflictError } from "@/lib/errors";

function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

export async function POST(_request: NextRequest) {
  try {
    const user = await requireAuth();

    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
    });

    if (!coupleMember) {
      throw new NotFoundError("You must create a couple first");
    }

    const existingInvitation = await db.coupleInvitation.findFirst({
      where: {
        coupleId: coupleMember.coupleId,
        usedById: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictError(
        "An active invitation already exists for this couple"
      );
    }

    const code = generateInvitationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const invitation = await db.coupleInvitation.create({
      data: {
        code,
        creatorId: user.id,
        coupleId: coupleMember.coupleId,
        expiresAt,
      },
    });

    return successResponse(
      {
        code: invitation.code,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    const coupleMember = await db.coupleMember.findFirst({
      where: { userId: user.id },
    });

    if (!coupleMember) {
      throw new NotFoundError("You must create a couple first");
    }

    const invitation = await db.coupleInvitation.findFirst({
      where: {
        coupleId: coupleMember.coupleId,
        usedById: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        code: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!invitation) {
      return successResponse(null);
    }

    return successResponse(invitation);
  } catch (error) {
    return errorResponse(error);
  }
}
