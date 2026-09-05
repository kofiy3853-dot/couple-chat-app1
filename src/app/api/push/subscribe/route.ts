import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return errorResponse(new Error("Missing subscription fields"));
    }

    // Upsert: delete old subscription with same endpoint, then create
    await db.pushSubscription.deleteMany({
      where: { endpoint },
    });

    await db.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint,
        p256dh,
        auth,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

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
