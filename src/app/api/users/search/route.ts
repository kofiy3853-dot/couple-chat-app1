import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return successResponse([]);
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      take: 20,
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse(error);
  }
}
