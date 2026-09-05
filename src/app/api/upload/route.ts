import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
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
      return errorResponse(new Error("File too large (max 5MB)"), 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(new Error("Invalid file type. Use JPEG, PNG, GIF, or WebP"), 400);
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    const url = `/uploads/${filename}`;
    return successResponse({ url, filename });
  } catch (error) {
    return errorResponse(error);
  }
}
