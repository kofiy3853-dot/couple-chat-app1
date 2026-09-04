import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { assertMessageAccess } from "@/lib/conversation-utils";

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

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

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

    if (!isImage && !isAudio) {
      return errorResponse(
        new ValidationError("Invalid file type", {
          file: ["Only JPEG, PNG, GIF, WebP images or WebM/MP4/MPEG/OGG/WAV audio are allowed"],
        })
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return errorResponse(
        new ValidationError("File too large", {
          file: ["Image must be 10MB or smaller"],
        })
      );
    }

    if (isAudio && file.size > MAX_AUDIO_SIZE) {
      return errorResponse(
        new ValidationError("File too large", {
          file: ["Audio must be 25MB or smaller"],
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

    // Only allow attaching to your own messages
    if (message.senderId !== user.id) {
      throw new ForbiddenError("You can only attach files to your own messages");
    }

    await assertMessageAccess(messageId, user.id);

    // Sanitize filename
    const sanitizedFilename = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(0, 200);

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "couple-chat",
              resource_type: isAudio ? "video" : "image",
              allowed_formats: isAudio
                ? ["webm", "mp4", "mp3", "ogg", "wav"]
                : ["jpg", "jpeg", "png", "gif", "webp"],
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
        filename: sanitizedFilename,
        mimeType: file.type,
        size: file.size,
      },
    });

    return successResponse(attachment, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
