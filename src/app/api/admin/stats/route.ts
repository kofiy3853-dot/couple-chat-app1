import { db } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";
import { subDays } from "date-fns";

export async function GET() {
  try {
    await requireAdmin();

    const thirtyDaysAgo = subDays(new Date(), 30);

    const [
      totalUsers,
      totalCouples,
      totalMessages,
      pendingReports,
    ] = await Promise.all([
      db.user.count(),
      db.couple.count(),
      db.message.count(),
      db.report.count({
        where: { status: "PENDING" },
      }),
    ]);

    const activeUsers = await db.user.count({
      where: { updatedAt: { gte: thirtyDaysAgo } },
    });

    return successResponse({
      totalUsers,
      activeUsers,
      totalCouples,
      totalMessages,
      pendingReports,
      storageUsage: "N/A",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
