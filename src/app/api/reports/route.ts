import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse, paginateResponse } from "@/lib/api-utils";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { reportSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const report = await db.report.create({
      data: {
        reporterId: user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
        description: parsed.data.description,
      },
    });

    return successResponse(report, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "ADMIN") {
      throw new ForbiddenError("Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const where = status ? { status: status as "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED" } : {};

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      }),
      db.report.count({ where }),
    ]);

    return paginateResponse(reports, page, limit, total);
  } catch (error) {
    return errorResponse(error);
  }
}
