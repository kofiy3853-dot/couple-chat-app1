import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { memorySchema } from "@/lib/validation";

async function getCoupleId(userId: string | undefined) {
  if (!userId) return null;
  const member = await db.coupleMember.findFirst({
    where: { userId },
    select: { coupleId: true },
  });
  return member?.coupleId ?? null;
}

async function verifyMemoryAccess(memoryId: string, userId: string | undefined) {
  if (!userId) throw new ForbiddenError("Unauthorized");
  const memory = await db.memory.findUnique({ where: { id: memoryId } });
  if (!memory) throw new NotFoundError("Memory not found");

  const coupleId = await getCoupleId(userId);
  if (!coupleId || memory.coupleId !== coupleId) {
    throw new ForbiddenError("You do not have access to this memory");
  }

  return memory;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { memoryId } = await params;

    await verifyMemoryAccess(memoryId, user.id);

    const memory = await db.memory.findUnique({
      where: { id: memoryId },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return successResponse(memory);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { memoryId } = await params;
    const body = await request.json();

    const memory = await verifyMemoryAccess(memoryId, user.id);

    if (memory.creatorId !== user.id) {
      throw new ForbiddenError("Only the creator can update this memory");
    }

    const parsed = memorySchema.partial().safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      return errorResponse(new ValidationError("Validation failed", fieldErrors));
    }

    const updated = await db.memory.update({
      where: { id: memoryId },
      data: parsed.data,
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { memoryId } = await params;

    const memory = await verifyMemoryAccess(memoryId, user.id);

    if (memory.creatorId !== user.id) {
      throw new ForbiddenError("Only the creator can delete this memory");
    }

    await db.memory.delete({ where: { id: memoryId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
