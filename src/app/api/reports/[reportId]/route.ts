import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

const updateReportSchema = z.object({
  status: z.enum(["REVIEWED", "RESOLVED", "REJECTED"]),
  adminNote: z
    .string()
    .max(1000, "Admin note must be at most 1000 characters")
    .optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await requireAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).role !== "ADMIN") {
      throw new ForbiddenError("Admin access required");
    }

    const { reportId } = await params;

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: { id: true, name: true, username: true, image: true },
        },
        reviewedBy: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    return successResponse(report);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await requireAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).role !== "ADMIN") {
      throw new ForbiddenError("Admin access required");
    }

    const { reportId } = await params;
    const body = await request.json();

    const parsed = updateReportSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const existing = await db.report.findUnique({ where: { id: reportId } });
    if (!existing) {
      throw new NotFoundError("Report not found");
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
        reviewedById: user.id,
      },
      include: {
        reporter: {
          select: { id: true, name: true, username: true, image: true },
        },
        reviewedBy: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    if (parsed.data.status === "RESOLVED" && existing.targetType === "USER") {
      await db.user.update({
        where: { id: existing.targetId },
        data: { status: "SUSPENDED" },
      });
    }

    return successResponse(report);
  } catch (error) {
    return errorResponse(error);
  }
}
