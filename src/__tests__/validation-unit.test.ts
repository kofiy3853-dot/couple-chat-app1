import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  messageSchema,
  memorySchema,
  timelineSchema,
  reportSchema,
  invitationSchema,
  privacySchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      username: "johndoe",
      email: "john@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      username: "johndoe",
      email: "john@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid username", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      username: "john doe",
      email: "john@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      username: "johndoe",
      email: "john@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("accepts valid text message", () => {
    const result = messageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Hello!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = messageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 5000 chars", () => {
    const result = messageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      content: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("defaults type to TEXT", () => {
    const result = messageSchema.safeParse({
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Hello!",
    });
    if (result.success) {
      expect(result.data.type).toBe("TEXT");
    }
  });
});

describe("memorySchema", () => {
  it("accepts valid input", () => {
    const result = memorySchema.safeParse({
      title: "Our first date",
      description: "At the park",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = memorySchema.safeParse({
      title: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("timelineSchema", () => {
  it("accepts valid input", () => {
    const result = timelineSchema.safeParse({
      title: "First anniversary",
      date: "2024-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = timelineSchema.safeParse({
      title: "",
      date: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts valid input", () => {
    const result = reportSchema.safeParse({
      targetType: "USER",
      targetId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "HARASSMENT",
      description: "This user is sending inappropriate messages repeatedly",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short description", () => {
    const result = reportSchema.safeParse({
      targetType: "USER",
      targetId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "HARASSMENT",
      description: "Short",
    });
    expect(result.success).toBe(false);
  });
});

describe("invitationSchema", () => {
  it("accepts valid code", () => {
    const result = invitationSchema.safeParse({ code: "ABC123" });
    expect(result.success).toBe(true);
  });

  it("rejects lowercase code", () => {
    const result = invitationSchema.safeParse({ code: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects wrong length", () => {
    const result = invitationSchema.safeParse({ code: "ABC" });
    expect(result.success).toBe(false);
  });
});

describe("privacySchema", () => {
  it("accepts valid input", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: true,
      showLastSeen: false,
      readReceipts: true,
    });
    expect(result.success).toBe(true);
  });
});
