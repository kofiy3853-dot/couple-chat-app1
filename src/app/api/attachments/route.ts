import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return errorResponse(
        new ValidationError("No file provided", { file: ["Required"] })
      );
    }

    if (!messageId) {
      return errorResponse(
        new ValidationError("messageId is required", {
          messageId: ["Required"],
        })
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        new ValidationError("Invalid file type", {
          file: ["Only JPEG, PNG, GIF, and WebP images are allowed"],
        })
      );
    }

    if (file.size > MAX_SIZE) {
      return errorResponse(
        new ValidationError("File too large", {
          file: ["File must be 10MB or smaller"],
        })
      );
    }

    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            couple: {
              include: {
                members: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    const isMember = message.conversation.couple.members.some(
      (m: { userId: string }) => m.userId === user.id
    );

    if (!isMember) {
      throw new ForbiddenError("You are not a member of this conversation");
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const safeFilename = `${randomUUID()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(UPLOAD_DIR, safeFilename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${safeFilename}`;

    const attachment = await db.attachment.create({
      data: {
        messageId,
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return successResponse(attachment, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
