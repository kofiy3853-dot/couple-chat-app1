import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse, getCurrentUser } from "@/lib/api-utils";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { memorySchema } from "@/lib/validation";

async function getCoupleId(userId: string) {
  const member = await db.coupleMember.findFirst({
    where: { userId },
    select: { coupleId: true },
  });
  return member?.coupleId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return successResponse({ memories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
    }

    const { searchParams } = new URL(request.url);

    const coupleId = await getCoupleId(user.id);
    if (!coupleId) {
      return successResponse({ memories: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
    }

    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const [memories, total] = await Promise.all([
      db.memory.findMany({
        where: { coupleId },
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      }),
      db.memory.count({ where: { coupleId } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return successResponse({
      memories,
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

    const parsed = memorySchema.safeParse(body);
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

    const memory = await db.memory.create({
      data: {
        coupleId,
        creatorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        date: parsed.data.date ?? new Date(),
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

      await db.notification.createMany({
        data: partnerIds.map((partnerId: string) => ({
          userId: partnerId,
          type: "MEMORY",
          title: "New Memory",
          message: `${user.name ?? "Your partner"} added a new memory: ${memory.title}`,
          link: `/memories/${memory.id}`,
        })),
      });
    }

    return successResponse(memory, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
