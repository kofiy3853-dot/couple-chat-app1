import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";

interface CoupleMember {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface CoupleWithCounts {
  id: string;
  createdAt: Date;
  members: CoupleMember[];
  _count: { memories: number };
  conversation: { _count: { messages: number } } | null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

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

    const mapped = (couples as CoupleWithCounts[]).map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      members: c.members.map((m) => m.user),
      messageCount: c.conversation?._count.messages ?? 0,
      memoryCount: c._count.memories,
    }));

    return paginateResponse(mapped, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}
