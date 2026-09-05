import { NextRequest } from "next/server";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB (base64 adds ~33% overhead)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse(new Error("No file provided"), 400);
    }

    if (file.size > MAX_SIZE) {
      return errorResponse(new Error("File too large (max 2MB)"), 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(new Error("Invalid file type. Use JPEG, PNG, GIF, or WebP"), 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return successResponse({ url: dataUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
