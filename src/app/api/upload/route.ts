import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-m4a"];

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse(new Error("No file provided"), 400);
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.type.startsWith("audio/");

    if (!isImage && !isAudio) {
      return errorResponse(new Error("Invalid file type. Use JPEG, PNG, GIF, WebP images or audio files"), 400);
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return errorResponse(new Error("Image too large (max 10MB)"), 400);
    }

    if (isAudio && file.size > MAX_AUDIO_SIZE) {
      return errorResponse(new Error("Audio too large (max 25MB)"), 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "couple-chat",
            resource_type: isAudio ? "video" : "image",
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Upload failed"));
            resolve({ secure_url: result.secure_url });
          }
        )
        .end(buffer);
    });

    return successResponse({ url: result.secure_url });
  } catch (error) {
    return errorResponse(error);
  }
}
