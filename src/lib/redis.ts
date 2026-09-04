import Redis from "ioredis";
import type { PresenceStatus } from "./constants";

const globalForRedis = globalThis as unknown as { redis: Redis | null };

const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;

if (redisUrl) {
  try {
    redis = globalForRedis.redis || new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
    if (!globalForRedis.redis) globalForRedis.redis = redis;
  } catch (err) {
    console.error("Failed to create Redis client:", err);
    redis = null;
  }
}

export { redis };

export async function getJSON<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (!redis) return;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, serialized, "EX", ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (err) {
    console.error("Redis setJSON error:", err);
  }
}

export async function del(...keys: string[]): Promise<number> {
  if (!redis || keys.length === 0) return 0;
  try {
    return await redis.del(...keys);
  } catch {
    return 0;
  }
}

export async function expire(key: string, seconds: number): Promise<boolean> {
  if (!redis) return false;
  try {
    const result = await redis.expire(key, seconds);
    return result === 1;
  } catch {
    return false;
  }
}

const ONLINE_PREFIX = "online:";
const RATE_LIMIT_PREFIX = "ratelimit:";
const ONLINE_SET = "online_users";

export async function setOnline(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`${ONLINE_PREFIX}${userId}`, "1", "EX", 300);
    await redis.sadd(ONLINE_SET, userId);
  } catch (err) {
    console.error("Redis setOnline error:", err);
  }
}

export async function setOffline(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`${ONLINE_PREFIX}${userId}`);
    await redis.srem(ONLINE_SET, userId);
  } catch (err) {
    console.error("Redis setOffline error:", err);
  }
}

export async function isOnline(userId: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const exists = await redis.exists(`${ONLINE_PREFIX}${userId}`);
    return exists === 1;
  } catch {
    return false;
  }
}

export async function getOnlineUsers(): Promise<string[]> {
  if (!redis) return [];
  try {
    return await redis.smembers(ONLINE_SET);
  } catch {
    return [];
  }
}

export async function setTyping(conversationId: string, userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.sadd(`typing:${conversationId}`, userId);
    await redis.expire(`typing:${conversationId}`, 5);
  } catch (err) {
    console.error("Redis setTyping error:", err);
  }
}

export async function removeTyping(conversationId: string, userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.srem(`typing:${conversationId}`, userId);
  } catch (err) {
    console.error("Redis removeTyping error:", err);
  }
}

export async function getTypingUsers(conversationId: string): Promise<string[]> {
  if (!redis) return [];
  try {
    return await redis.smembers(`typing:${conversationId}`);
  } catch {
    return [];
  }
}

const PRESENCE_PREFIX = "presence:";

export async function setPresenceStatus(userId: string, status: PresenceStatus): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`${PRESENCE_PREFIX}${userId}`, status, "EX", 300);
  } catch (err) {
    console.error("Redis setPresenceStatus error:", err);
  }
}

export async function getPresenceStatus(userId: string): Promise<PresenceStatus | null> {
  if (!redis) return null;
  try {
    const status = await redis.get(`${PRESENCE_PREFIX}${userId}`);
    if (!status || !["online", "typing", "recording", "in-call"].includes(status)) return null;
    return status as PresenceStatus;
  } catch {
    return null;
  }
}

export async function clearPresenceStatus(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`${PRESENCE_PREFIX}${userId}`);
  } catch (err) {
    console.error("Redis clearPresenceStatus error:", err);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    return { allowed: true, remaining: limit, resetAt: Math.floor(Date.now() / 1000) + windowSeconds };
  }
  try {
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
  } catch (err) {
    console.error("Redis checkRateLimit error:", err);
    return { allowed: true, remaining: limit, resetAt: Math.floor(Date.now() / 1000) + windowSeconds };
  }
}
