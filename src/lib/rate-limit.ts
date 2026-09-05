import { redis } from "./redis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const RATE_LIMIT_PREFIX = "rl:";

export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Math.floor(Date.now() / 1000) + Math.floor(config.windowMs / 1000),
    };
  }

  try {
    const redisKey = `${RATE_LIMIT_PREFIX}${config.keyPrefix}:${key}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - Math.floor(config.windowMs / 1000);

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = now + Math.ceil(config.windowMs / 1000);

    return {
      allowed: count <= config.maxRequests,
      remaining,
      resetAt,
    };
  } catch (err) {
    console.error("Rate limit error:", err);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Math.floor(Date.now() / 1000) + Math.floor(config.windowMs / 1000),
    };
  }
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: "auth" },
  api: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: "api" },
  messages: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: "msg" },
  uploads: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: "upload" },
  invitations: { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: "inv" },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
