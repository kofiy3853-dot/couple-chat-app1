import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";

const CLEANUP_SECRET = process.env.CLEANUP_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { secret } = body as { secret?: string };

    if (!CLEANUP_SECRET || secret !== CLEANUP_SECRET) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    await db.messageReaction.deleteMany();
    await db.attachment.deleteMany();
    await db.message.deleteMany();
    await db.conversationParticipant.deleteMany();
    await db.conversation.deleteMany();
    await db.coupleInvitation.deleteMany();
    await db.coupleMember.deleteMany();
    await db.couple.deleteMany();
    await db.memory.deleteMany();
    await db.timelineEvent.deleteMany();
    await db.notification.deleteMany();
    await db.report.deleteMany();
    await db.userPrivacySetting.deleteMany();
    await db.user.deleteMany();

    return successResponse({ message: "All data deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
