import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from "@/lib/errors";

describe("AppError", () => {
  it("creates error with default values", () => {
    const error = new AppError("test");
    expect(error.message).toBe("test");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.name).toBe("AppError");
  });

  it("creates error with custom values", () => {
    const error = new AppError("custom", 418, "TEAPOT");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
  });

  it("is instanceof Error", () => {
    const error = new AppError("test");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("has 404 status", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("accepts custom message", () => {
    const error = new NotFoundError("User not found");
    expect(error.message).toBe("User not found");
  });
});

describe("UnauthorizedError", () => {
  it("has 401 status", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("has 403 status", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});

describe("ValidationError", () => {
  it("has 400 status", () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("stores field errors", () => {
    const errors = { email: ["Invalid email"], password: ["Too short"] };
    const error = new ValidationError("Validation failed", errors);
    expect(error.errors).toEqual(errors);
  });
});

describe("ConflictError", () => {
  it("has 409 status", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });
});
