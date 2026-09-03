import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
    userId: session.user.id,
  });
}