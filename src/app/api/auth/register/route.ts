import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });
      throw new ValidationError("Validation failed", fieldErrors);
    }

    const { name, username, email, password } = parsed.data;

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      throw new ValidationError("Account already exists", {
        email: existing.email === email ? ["Email already in use"] : [],
        username: existing.username === username ? ["Username already taken"] : [],
      });
    }

    const hashed = await hash(password, 10);

    const user = await db.user.create({
      data: { name, username, email, password: hashed },
      select: { id: true, name: true, email: true, username: true },
    });

    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
