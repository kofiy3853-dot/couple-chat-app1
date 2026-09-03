import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { assertMessageAccess } from "@/lib/conversation-utils";

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return errorResponse(new ValidationError("No file provided", { file: ["Required"] }));
    }

    if (!messageId) {
      return errorResponse(new ValidationError("messageId is required", { messageId: ["Required"] }));
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

    // Verify user is a member of this conversation
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            couple: { include: { members: { select: { userId: true } } } },
          },
        },
      },
    });

    if (!message) throw new NotFoundError("Message not found");

    await assertMessageAccess(messageId, user.id);

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "couple-chat",
              resource_type: "image",
              allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
            },
            (error, result) => {
              if (error || !result) return reject(error ?? new Error("Upload failed"));
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          )
          .end(buffer);
      }
    );

    const attachment = await db.attachment.create({
      data: {
        messageId,
        url: uploadResult.secure_url,
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
