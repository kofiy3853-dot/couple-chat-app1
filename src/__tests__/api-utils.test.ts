/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => {
      return {
        status: init?.status ?? 200,
        body,
        json: () => Promise.resolve(body),
      } as unknown as NextResponse;
    }),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import {
  successResponse,
  errorResponse,
  paginateResponse,
  getCurrentUser,
  requireAuth,
} from "@/lib/api-utils";
import { NotFoundError, ValidationError, UnauthorizedError } from "@/lib/errors";

describe("successResponse", () => {
  it("returns success response with data", () => {
    const data = { id: "1", name: "Test" };
    const response = successResponse(data);
    expect(response.status).toBe(200);
  });

  it("returns success response with custom status", () => {
    const data = { created: true };
    const response = successResponse(data, 201);
    expect(response.status).toBe(201);
  });

  it("returns success response with default status 200", () => {
    const response = successResponse("ok");
    expect(response.status).toBe(200);
  });
});

describe("errorResponse", () => {
  it("returns error response for AppError", () => {
    const error = new NotFoundError("User not found");
    const response = errorResponse(error);
    expect(response.status).toBe(404);
  });

  it("returns error response for ValidationError with errors", () => {
    const error = new ValidationError("Invalid input", {
      email: ["Invalid email"],
    });
    const response = errorResponse(error);
    expect(response.status).toBe(400);
  });

  it("returns 500 for unknown errors", () => {
    const response = errorResponse(new Error("Unknown"));
    expect(response.status).toBe(500);
  });

  it("returns custom status for non-AppError", () => {
    const response = errorResponse("string error", 502);
    expect(response.status).toBe(502);
  });
});

describe("paginateResponse", () => {
  it("returns paginated response", () => {
    const data = [{ id: "1" }, { id: "2" }];
    const response = paginateResponse(data, 1, 10, 25);
    expect(response.status).toBe(200);
  });

  it("calculates totalPages correctly", () => {
    const data = [1, 2, 3];
    const response = paginateResponse(data, 1, 10, 25);
    expect(response.status).toBe(200);
  });

  it("returns empty array for page beyond total", () => {
    const data: unknown[] = [];
    const response = paginateResponse(data, 10, 10, 5);
    expect(response.status).toBe(200);
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as any);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns null when session has no user id", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({ user: {} } as any);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns user when session exists", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "user-1",
        name: "John",
        email: "john@example.com",
        image: "https://example.com/img.jpg",
        username: "johndoe",
        role: "USER",
      },
    } as any);

    const user = await getCurrentUser();
    expect(user).toEqual({
      id: "user-1",
      name: "John",
      email: "john@example.com",
      image: "https://example.com/img.jpg",
      username: "johndoe",
      role: "USER",
    });
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UnauthorizedError when no session", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null as any);

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });

  it("returns user when authenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "John" },
    } as any);

    const user = await requireAuth();
    expect(user.id).toBe("user-1");
  });
});
