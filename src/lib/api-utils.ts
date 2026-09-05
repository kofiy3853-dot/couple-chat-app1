import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError, AppError, ValidationError } from "./errors";
import { auth } from "./auth";
import { ROLES } from "./constants";
import { rateLimit, RATE_LIMITS, type RateLimitKey } from "./rate-limit";

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

// Get current user from session
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: (session.user as Record<string, unknown>).username as string | null,
    role: (session.user as Record<string, unknown>).role as string | null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}

export async function checkRateLimit(
  identifier: string,
  limitKey: RateLimitKey
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[limitKey];
  const result = await rateLimit(identifier, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Too many requests",
          code: "RATE_LIMITED",
          retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetAt - Math.floor(Date.now() / 1000)),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}