import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const count = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return successResponse({ count });
  } catch (error) {
    return errorResponse(error);
  }
}
