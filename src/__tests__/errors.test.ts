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
    const error = new AppError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.name).toBe("AppError");
  });

  it("creates error with custom statusCode and code", () => {
    const error = new AppError("Custom error", 418, "TEAPOT");
    expect(error.message).toBe("Custom error");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
  });

  it("is an instance of Error", () => {
    const error = new AppError("Test");
    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of AppError", () => {
    const error = new AppError("Test");
    expect(error).toBeInstanceOf(AppError);
  });

  it("has a stack trace", () => {
    const error = new AppError("Test");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("AppError");
  });
});

describe("NotFoundError", () => {
  it("creates error with default message", () => {
    const error = new NotFoundError();
    expect(error.message).toBe("Resource not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
  });

  it("creates error with custom message", () => {
    const error = new NotFoundError("User not found");
    expect(error.message).toBe("User not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("is an instance of AppError", () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(AppError);
  });

  it("is an instance of Error", () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(Error);
  });
});

describe("UnauthorizedError", () => {
  it("creates error with default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.name).toBe("UnauthorizedError");
  });

  it("creates error with custom message", () => {
    const error = new UnauthorizedError("Invalid token");
    expect(error.message).toBe("Invalid token");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("is an instance of AppError", () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("ForbiddenError", () => {
  it("creates error with default message", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Forbidden");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.name).toBe("ForbiddenError");
  });

  it("creates error with custom message", () => {
    const error = new ForbiddenError("Insufficient permissions");
    expect(error.message).toBe("Insufficient permissions");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("is an instance of AppError", () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("ValidationError", () => {
  it("creates error with default message and empty errors", () => {
    const error = new ValidationError();
    expect(error.message).toBe("Validation failed");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationError");
    expect(error.errors).toEqual({});
  });

  it("creates error with custom message and errors", () => {
    const errors = {
      email: ["Invalid email", "Email already exists"],
      password: ["Password too short"],
    };
    const error = new ValidationError("Invalid input", errors);
    expect(error.message).toBe("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.errors).toEqual(errors);
  });

  it("is an instance of AppError", () => {
    const error = new ValidationError();
    expect(error).toBeInstanceOf(AppError);
  });

  it("preserves error arrays", () => {
    const errors = { field: ["error1", "error2", "error3"] };
    const error = new ValidationError("Failed", errors);
    expect(error.errors.field).toHaveLength(3);
  });
});

describe("ConflictError", () => {
  it("creates error with default message", () => {
    const error = new ConflictError();
    expect(error.message).toBe("Resource already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.name).toBe("ConflictError");
  });

  it("creates error with custom message", () => {
    const error = new ConflictError("Username already taken");
    expect(error.message).toBe("Username already taken");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("is an instance of AppError", () => {
    const error = new ConflictError();
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("error properties consistency", () => {
  it("all error classes have correct statusCode", () => {
    expect(new AppError("msg").statusCode).toBe(500);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new ValidationError().statusCode).toBe(400);
    expect(new ConflictError().statusCode).toBe(409);
  });

  it("all error classes have correct code", () => {
    expect(new AppError("msg").code).toBe("INTERNAL_ERROR");
    expect(new NotFoundError().code).toBe("NOT_FOUND");
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
    expect(new ForbiddenError().code).toBe("FORBIDDEN");
    expect(new ValidationError().code).toBe("VALIDATION_ERROR");
    expect(new ConflictError().code).toBe("CONFLICT");
  });

  it("all error classes have correct name", () => {
    expect(new AppError("msg").name).toBe("AppError");
    expect(new NotFoundError().name).toBe("NotFoundError");
    expect(new UnauthorizedError().name).toBe("UnauthorizedError");
    expect(new ForbiddenError().name).toBe("ForbiddenError");
    expect(new ValidationError().name).toBe("ValidationError");
    expect(new ConflictError().name).toBe("ConflictError");
  });

  it("all error classes extend Error", () => {
    expect(new AppError("msg")).toBeInstanceOf(Error);
    expect(new NotFoundError()).toBeInstanceOf(Error);
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
    expect(new ForbiddenError()).toBeInstanceOf(Error);
    expect(new ValidationError()).toBeInstanceOf(Error);
    expect(new ConflictError()).toBeInstanceOf(Error);
  });
});
