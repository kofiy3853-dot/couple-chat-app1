import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (endpoint) {
      await db.pushSubscription.deleteMany({
        where: { userId: user.id, endpoint },
      });
    } else {
      await db.pushSubscription.deleteMany({
        where: { userId: user.id },
      });
    }

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
