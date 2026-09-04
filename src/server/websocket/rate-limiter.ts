interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export function createRateLimiter(config: RateLimitConfig) {
  return function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
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