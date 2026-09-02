import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { auth } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        sub: session.user.id,
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      url: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
      token,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
