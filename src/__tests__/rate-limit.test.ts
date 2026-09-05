import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  redis: null,
}));

import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests when redis is unavailable", async () => {
    const result = await rateLimit("test-key", RATE_LIMITS.api);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.api.maxRequests);
  });

  it("returns valid resetAt timestamp", async () => {
    const result = await rateLimit("test-key", RATE_LIMITS.api);
    expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("RATE_LIMITS config", () => {
  it("has auth rate limit", () => {
    expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000);
  });

  it("has api rate limit", () => {
    expect(RATE_LIMITS.api.maxRequests).toBe(100);
    expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
  });

  it("has messages rate limit", () => {
    expect(RATE_LIMITS.messages.maxRequests).toBe(60);
  });

  it("has uploads rate limit", () => {
    expect(RATE_LIMITS.uploads.maxRequests).toBe(10);
  });

  it("has invitations rate limit", () => {
    expect(RATE_LIMITS.invitations.maxRequests).toBe(5);
  });
});
