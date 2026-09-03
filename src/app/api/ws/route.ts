import { NextResponse } from "next/server";

export async function GET() {
  // Demo mode - return WebSocket URL without token
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
    token: "",
  });
}