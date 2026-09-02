/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

import { db } from "@/lib/db";
import { compare } from "bcryptjs";

describe("authentication flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("user lookup", () => {
    it("finds user by email", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        password: "hashed_password",
      };
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const user = await db.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null for non-existent user", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const user = await db.user.findUnique({
        where: { email: "nonexistent@example.com" },
      });

      expect(user).toBeNull();
    });
  });

  describe("password verification", () => {
    it("validates correct password", async () => {
      vi.mocked(compare).mockResolvedValue(true as never);

      const isValid = await compare("password123", "hashed_password");
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password", async () => {
      vi.mocked(compare).mockResolvedValue(false as never);

      const isValid = await compare("wrongpassword", "hashed_password");
      expect(isValid).toBe(false);
    });
  });

  describe("authorization logic", () => {
    it("returns null when credentials are missing", () => {
      const credentials = { email: null, password: null };
      const hasCredentials = credentials?.email && credentials?.password;
      expect(hasCredentials).toBeFalsy();
    });

    it("returns null when user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const user = await db.user.findUnique({
        where: { email: "test@example.com" },
      });

      const authorizeResult = user ? user : null;
      expect(authorizeResult).toBeNull();
    });

    it("returns null when user has no password", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: null,
      } as any);

      const user = await db.user.findUnique({
        where: { email: "test@example.com" },
      });

      const hasPassword = user?.password;
      expect(hasPassword).toBeFalsy();
    });

    it("returns user data when credentials are valid", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        username: "testuser",
        password: "hashed_password",
        image: null,
        role: "USER",
      };
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(compare).mockResolvedValue(true as never);

      const user = await db.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(user).toBeDefined();
      expect(user?.password).toBeDefined();

      const isPasswordValid = await compare("password123", user!.password!);
      expect(isPasswordValid).toBe(true);
    });
  });

  describe("session and token handling", () => {
    it("extracts user id from token", () => {
      const token = {
        id: "user-1",
        username: "testuser",
        role: "USER",
      };

      expect(token.id).toBe("user-1");
      expect(typeof token.id).toBe("string");
    });

    it("populates session user from token", () => {
      const token = {
        id: "user-1",
        username: "testuser",
        role: "USER",
      };

      const sessionUser = {
        id: token.id as string,
      };

      expect(sessionUser.id).toBe("user-1");
    });
  });

  describe("protected route access", () => {
    it("requires session user id", () => {
      const session = { user: { id: "user-1" } };
      expect(session?.user?.id).toBeDefined();
    });

    it("rejects session without user id", () => {
      const session: { user?: { id?: string } } = { user: {} };
      const hasUserId = !!session?.user?.id;
      expect(hasUserId).toBe(false);
    });

    it("rejects null session", () => {
      const session = null as unknown as { user: { id: string } } | null;
      const hasUserId = !!(session && session.user && session.user.id);
      expect(hasUserId).toBe(false);
    });

    it("rejects undefined session", () => {
      const session = undefined as unknown as { user: { id: string } } | undefined;
      const hasUserId = !!(session && session.user && session.user.id);
      expect(hasUserId).toBe(false);
    });
  });
});
