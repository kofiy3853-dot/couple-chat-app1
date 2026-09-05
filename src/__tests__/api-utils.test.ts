import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  RATE_LIMITS: {
    auth: { windowMs: 900000, maxRequests: 10, keyPrefix: "auth" },
    api: { windowMs: 60000, maxRequests: 100, keyPrefix: "api" },
    messages: { windowMs: 60000, maxRequests: 60, keyPrefix: "msg" },
    uploads: { windowMs: 60000, maxRequests: 10, keyPrefix: "upload" },
    invitations: { windowMs: 60000, maxRequests: 5, keyPrefix: "inv" },
  },
}));

import { successResponse, errorResponse, getClientIp } from "@/lib/api-utils";
import { NotFoundError, ValidationError } from "@/lib/errors";

describe("successResponse", () => {
  it("returns 200 by default", () => {
    const response = successResponse({ id: 1 });
    expect(response.status).toBe(200);
  });

  it("returns custom status code", () => {
    const response = successResponse({ id: 1 }, 201);
    expect(response.status).toBe(201);
  });

  it("returns correct JSON structure", async () => {
    const response = successResponse({ name: "test" });
    const body = await response.json();
    expect(body).toEqual({ success: true, data: { name: "test" } });
  });
});

describe("errorResponse", () => {
  it("handles AppError", () => {
    const error = new NotFoundError("Not found");
    const response = errorResponse(error);
    expect(response.status).toBe(404);
  });

  it("handles ValidationError with field errors", async () => {
    const error = new ValidationError("Invalid", { email: ["Required"] });
    const response = errorResponse(error);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errors).toEqual({ email: ["Required"] });
  });

  it("handles unknown errors as 500", () => {
    const response = errorResponse(new Error("something"));
    expect(response.status).toBe(500);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("returns unknown when no header", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });
});
