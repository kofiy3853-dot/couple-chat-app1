import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "ADMIN") {
      const { ForbiddenError } = await import("@/lib/errors");
      return errorResponse(new ForbiddenError());
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const [couples, total] = await Promise.all([
      db.couple.findMany({
        select: {
          id: true,
          createdAt: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              memories: true,
            },
          },
          conversation: {
            select: {
              _count: {
                select: {
                  messages: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.couple.count(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = couples.map((c: any) => ({
      id: c.id,
      createdAt: c.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members: c.members.map((m: any) => m.user),
      messageCount: c.conversation?._count.messages ?? 0,
      memoryCount: c._count.memories,
    }));

    return paginateResponse(mapped, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}
