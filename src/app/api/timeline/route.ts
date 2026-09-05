import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { timelineSchema } from "@/lib/validation";
import { createNotificationMany } from "@/lib/notification-helpers";

async function getCoupleId(userId: string) {
  const member = await db.coupleMember.findFirst({
    where: { userId },
    select: { coupleId: true },
  });
  return member?.coupleId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const coupleId = await getCoupleId(user.id);
    if (!coupleId) {
      throw new ForbiddenError("You are not part of a couple");
    }

    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      db.timelineEvent.findMany({
        where: { coupleId },
        orderBy: { date: "asc" },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      }),
      db.timelineEvent.count({ where: { coupleId } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return successResponse({
      events,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = timelineSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const coupleId = await getCoupleId(user.id);
    if (!coupleId) {
      throw new ForbiddenError("You are not part of a couple");
    }

    const event = await db.timelineEvent.create({
      data: {
        coupleId,
        creatorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        date: parsed.data.date,
        imageUrl: body.imageUrl,
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    const couple = await db.couple.findUnique({
      where: { id: coupleId },
      include: { members: { select: { userId: true } } },
    });

    if (couple) {
      const partnerIds = couple.members
        .map((m: { userId: string }) => m.userId)
        .filter((id: string) => id !== user.id);

      await createNotificationMany(
        partnerIds,
        "TIMELINE",
        "New Timeline Event",
        `${user.name ?? "Your partner"} added a timeline event: ${event.title}`,
        `/timeline/${event.id}`,
      );
    }

    return successResponse(event, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
