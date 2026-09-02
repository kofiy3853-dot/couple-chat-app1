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
  const validInput = {
    name: "John Doe",
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
  };

  it("accepts valid input", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects username exceeding 30 characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: "a".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: "john@doe!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts username with underscores and numbers", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: "john_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects email without @", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "johnexample.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  const validInput = {
    email: "john@example.com",
    password: "password123",
  };

  it("accepts valid input", () => {
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      ...validInput,
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      ...validInput,
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "john@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("accepts valid message", () => {
    const result = messageSchema.safeParse({ content: "Hello!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = messageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 5000 characters", () => {
    const result = messageSchema.safeParse({ content: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("accepts message at max length", () => {
    const result = messageSchema.safeParse({ content: "a".repeat(5000) });
    expect(result.success).toBe(true);
  });

  it("accepts single character message", () => {
    const result = messageSchema.safeParse({ content: "a" });
    expect(result.success).toBe(true);
  });

  it("accepts message with special characters and emoji", () => {
    const result = messageSchema.safeParse({
      content: "Hello! 🎉 @#$%^&*()",
    });
    expect(result.success).toBe(true);
  });
});

describe("memorySchema", () => {
  it("accepts valid memory with all fields", () => {
    const result = memorySchema.safeParse({
      title: "Our first date",
      description: "At the coffee shop",
      date: "2024-01-15",
      imageUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts memory with only title", () => {
    const result = memorySchema.safeParse({ title: "Memory" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = memorySchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const result = memorySchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const result = memorySchema.safeParse({
      title: "Title",
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid imageUrl", () => {
    const result = memorySchema.safeParse({
      title: "Title",
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid date string", () => {
    const result = memorySchema.safeParse({
      title: "Title",
      date: "2024-06-15",
    });
    expect(result.success).toBe(true);
  });
});

describe("timelineSchema", () => {
  it("accepts valid timeline entry", () => {
    const result = timelineSchema.safeParse({
      title: "First anniversary",
      description: "Celebrated together",
      date: "2024-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts timeline with only title and date", () => {
    const result = timelineSchema.safeParse({
      title: "Milestone",
      date: "2024-06-15",
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

  it("rejects missing date", () => {
    const result = timelineSchema.safeParse({ title: "Event" });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const result = timelineSchema.safeParse({
      title: "a".repeat(201),
      date: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("reportSchema", () => {
  const validInput = {
    targetType: "USER" as const,
    targetId: "550e8400-e29b-41d4-a716-446655440000",
    reason: "HARASSMENT" as const,
    description: "This user is sending inappropriate messages repeatedly.",
  };

  it("accepts valid report", () => {
    const result = reportSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts all target types", () => {
    for (const targetType of ["USER", "MESSAGE", "IMAGE"]) {
      const result = reportSchema.safeParse({
        ...validInput,
        targetType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all reason types", () => {
    for (const reason of [
      "HARASSMENT",
      "SPAM",
      "INAPPROPRIATE_CONTENT",
      "IMPERSONATION",
      "OTHER",
    ]) {
      const result = reportSchema.safeParse({ ...validInput, reason });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid targetType", () => {
    const result = reportSchema.safeParse({
      ...validInput,
      targetType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid targetId (not UUID)", () => {
    const result = reportSchema.safeParse({
      ...validInput,
      targetId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid reason", () => {
    const result = reportSchema.safeParse({
      ...validInput,
      reason: "INVALID_REASON",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = reportSchema.safeParse({
      ...validInput,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const result = reportSchema.safeParse({
      ...validInput,
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("invitationSchema", () => {
  it("accepts valid 6-character alphanumeric code", () => {
    const result = invitationSchema.safeParse({ code: "ABC123" });
    expect(result.success).toBe(true);
  });

  it("accepts all uppercase letters", () => {
    const result = invitationSchema.safeParse({ code: "ABCDEF" });
    expect(result.success).toBe(true);
  });

  it("accepts all numbers", () => {
    const result = invitationSchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects code shorter than 6 characters", () => {
    const result = invitationSchema.safeParse({ code: "ABC12" });
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 6 characters", () => {
    const result = invitationSchema.safeParse({ code: "ABC1234" });
    expect(result.success).toBe(false);
  });

  it("rejects code with lowercase letters", () => {
    const result = invitationSchema.safeParse({ code: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects code with special characters", () => {
    const result = invitationSchema.safeParse({ code: "AB-123" });
    expect(result.success).toBe(false);
  });

  it("rejects code with spaces", () => {
    const result = invitationSchema.safeParse({ code: "AB 123" });
    expect(result.success).toBe(false);
  });
});

describe("privacySchema", () => {
  it("accepts all fields set to true", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: true,
      showLastSeen: true,
      readReceipts: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all fields set to false", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: false,
      showLastSeen: false,
      readReceipts: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts mixed boolean values", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: true,
      showLastSeen: false,
      readReceipts: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean showOnlineStatus", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: "yes",
      showLastSeen: true,
      readReceipts: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean showLastSeen", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: true,
      showLastSeen: 1,
      readReceipts: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean readReceipts", () => {
    const result = privacySchema.safeParse({
      showOnlineStatus: true,
      showLastSeen: true,
      readReceipts: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = privacySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
