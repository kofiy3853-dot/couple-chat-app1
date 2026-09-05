import { successResponse } from "@/lib/api-utils";

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return successResponse({ publicKey: null });
  }
  return successResponse({ publicKey });
}
