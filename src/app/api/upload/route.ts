import { NextRequest } from "next/server";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB (base64 adds ~33% overhead)
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
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
      return errorResponse(new Error("Image too large (max 2MB)"), 400);
    }

    if (isAudio && file.size > MAX_AUDIO_SIZE) {
      return errorResponse(new Error("Audio too large (max 10MB)"), 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return successResponse({ url: dataUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
