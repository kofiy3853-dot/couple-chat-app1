import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { timelineSchema } from "@/lib/validation";

async function getCoupleId(userId: string | undefined) {
  if (!userId) return null;
  const member = await db.coupleMember.findFirst({
    where: { userId },
    select: { coupleId: true },
  });
  return member?.coupleId ?? null;
}

async function verifyEventAccess(eventId: string, userId: string | undefined) {
  if (!userId) throw new ForbiddenError("Unauthorized");
  const event = await db.timelineEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError("Event not found");

  const coupleId = await getCoupleId(userId);
  if (!coupleId || event.coupleId !== coupleId) {
    throw new ForbiddenError("You do not have access to this event");
  }

  return event;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth();
    const { eventId } = await params;

    await verifyEventAccess(eventId, user.id);

    const event = await db.timelineEvent.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return successResponse(event);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth();
    const { eventId } = await params;
    const body = await request.json();

    const event = await verifyEventAccess(eventId, user.id);

    if (event.creatorId !== user.id) {
      throw new ForbiddenError("Only the creator can update this event");
    }

    const parsed = timelineSchema.partial().safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const updated = await db.timelineEvent.update({
      where: { id: eventId },
      data: { ...parsed.data, imageUrl: body.imageUrl },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth();
    const { eventId } = await params;

    const event = await verifyEventAccess(eventId, user.id);

    if (event.creatorId !== user.id) {
      throw new ForbiddenError("Only the creator can delete this event");
    }

    await db.timelineEvent.delete({ where: { id: eventId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
