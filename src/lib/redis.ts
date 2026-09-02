import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = globalForRedis.redis || new Redis(redisUrl);

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function getJSON<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, serialized, "EX", ttlSeconds);
  } else {
    await redis.set(key, serialized);
  }
}

export async function del(...keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  return redis.del(...keys);
}

export async function expire(key: string, seconds: number): Promise<boolean> {
  const result = await redis.expire(key, seconds);
  return result === 1;
}

const ONLINE_PREFIX = "online:";
const TYPING_PREFIX = "typing:";
const RATE_LIMIT_PREFIX = "ratelimit:";
const ONLINE_SET = "online_users";

export async function setOnline(userId: string): Promise<void> {
  await redis.set(`${ONLINE_PREFIX}${userId}`, "1", "EX", 300);
  await redis.sadd(ONLINE_SET, userId);
}

export async function setOffline(userId: string): Promise<void> {
  await redis.del(`${ONLINE_PREFIX}${userId}`);
  await redis.srem(ONLINE_SET, userId);
}

export async function isOnline(userId: string): Promise<boolean> {
  const exists = await redis.exists(`${ONLINE_PREFIX}${userId}`);
  return exists === 1;
}

export async function getOnlineUsers(): Promise<string[]> {
  return redis.smembers(ONLINE_SET);
}

export async function setTyping(conversationId: string, userId: string): Promise<void> {
  await redis.set(`${TYPING_PREFIX}${conversationId}:${userId}`, "1", "EX", 5);
}

export async function removeTyping(conversationId: string, userId: string): Promise<void> {
  await redis.del(`${TYPING_PREFIX}${conversationId}:${userId}`);
}

export async function getTypingUsers(conversationId: string): Promise<string[]> {
  const keys = await redis.keys(`${TYPING_PREFIX}${conversationId}:*`);
  return keys.map((key) => key.split(":").pop()!);
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSeconds);
  const results = await pipeline.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;
  const remaining = Math.max(0, limit - count);
  const resetAt = now + windowSeconds;

  return {
    allowed: count <= limit,
    remaining,
    resetAt,
  };
}
