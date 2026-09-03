import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        status: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      const { ValidationError } = await import("@/lib/errors");
      return errorResponse(
        new ValidationError(
          "Validation failed",
          fieldErrors
        )
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        updatedAt: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();

    await db.user.delete({
      where: { id: user.id },
    });

    return successResponse({ message: "Account deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
