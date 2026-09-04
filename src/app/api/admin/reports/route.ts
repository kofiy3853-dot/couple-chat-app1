import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");

    const where = status ? { status: status as "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED" } : {};

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          description: true,
          status: true,
          adminNote: true,
          createdAt: true,
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.report.count({ where }),
    ]);

    return paginateResponse(reports, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}
