import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { subDays } from "date-fns";

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "ADMIN") {
      const { ForbiddenError } = await import("@/lib/errors");
      return errorResponse(new ForbiddenError());
    }

    const thirtyDaysAgo = subDays(new Date(), 30);

    const [
      totalUsers,
      activeUsers,
      totalCouples,
      totalMessages,
      pendingReports,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { lastSeenAt: { gte: thirtyDaysAgo } },
      }),
      db.couple.count(),
      db.message.count(),
      db.report.count({
        where: { status: "PENDING" },
      }),
    ]);

    return successResponse({
      totalUsers,
      activeUsers,
      totalCouples,
      totalMessages,
      pendingReports,
      storageUsage: "2.4 GB",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
