import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api-utils";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        new ValidationError(
          "Validation failed",
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return errorResponse(new AppError("User not found", 404, "NOT_FOUND"));
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
