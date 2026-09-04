import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,

          _count: {
            select: {
              coupleMembers: true,
              sentMessages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return paginateResponse(users, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}
