import Redis from "ioredis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const REDIS_URL = process.env.REDIS_URL;
let redis: Redis | null = null;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.on("error", () => { redis = null; });
  } catch {
    redis = null;
  }
}

// In-memory fallback for single-instance
const rateLimitStore = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL = 60_000;

if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export function createRateLimiter(config: RateLimitConfig) {
  return async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    // Try Redis first for distributed rate limiting
    if (redis) {
      try {
        const redisKey = `rl:${key}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;

        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(redisKey, 0, windowStart);
        pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
        pipeline.zcard(redisKey);
        pipeline.pexpire(redisKey, config.windowMs);
        const results = await pipeline.exec();

        if (results) {
          const count = (results[2][1] as number) || 0;
          const resetAt = now + config.windowMs;
          return {
            allowed: count <= config.maxRequests,
            remaining: Math.max(0, config.maxRequests - count),
            resetAt,
          };
        }
      } catch {
        // Fall through to in-memory
      }
    }

    // In-memory fallback
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
      const newRecord = { count: 1, resetAt: now + config.windowMs };
      rateLimitStore.set(key, newRecord);
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: newRecord.resetAt };
    }

    if (record.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
  };
}

export const messageRateLimiter = createRateLimiter({ windowMs: 1000, maxRequests: 10 });
export const typingRateLimiter = createRateLimiter({ windowMs: 1000, maxRequests: 5 });
export const reactionRateLimiter = createRateLimiter({ windowMs: 1000, maxRequests: 20 });
export const gameRateLimiter = createRateLimiter({ windowMs: 5000, maxRequests: 5 });
export const connectionRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 50 });
