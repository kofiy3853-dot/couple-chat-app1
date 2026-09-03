import { NextResponse } from "next/server";
import { UnauthorizedError, AppError, ValidationError } from "./errors";

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  role?: string | null;
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown, status?: number): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(error instanceof ValidationError ? { errors: error.errors } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unexpected error:", error);
  return NextResponse.json(
    {
      success: false,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    },
    { status: status ?? 500 }
  );
}

export function paginateResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

// Demo mode: return hardcoded user
export async function getCurrentUser(): Promise<AuthUser | null> {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Naomi",
    email: "naomi@example.com",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naomi",
    username: "naomi",
    role: "USER",
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}