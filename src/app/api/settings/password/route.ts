import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        new (await import("@/lib/errors")).ValidationError(
          "Validation failed",
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        )
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!fullUser?.password) {
      return errorResponse(
        new (await import("@/lib/errors")).AppError(
          "No password set for this account",
          400,
          "NO_PASSWORD"
        )
      );
    }

    const isCurrentValid = await compare(currentPassword, fullUser.password);
    if (!isCurrentValid) {
      return errorResponse(
        new (await import("@/lib/errors")).AppError(
          "Current password is incorrect",
          400,
          "INVALID_PASSWORD"
        )
      );
    }

    const hashedPassword = await hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: "Password updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
