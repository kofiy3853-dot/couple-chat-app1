import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where: { userId: user.id } }),
    ]);

    return paginateResponse(notifications, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const { ids } = (body ?? {}) as { ids?: string[] };

    if (ids && ids.length > 0) {
      await db.notification.updateMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
        data: { read: true },
      });
    } else {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
