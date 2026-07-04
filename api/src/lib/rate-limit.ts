/**
 * Rate limiting — Redis-backed sliding window with in-memory fallback.
 */
import { getRedis } from "./redis.js";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `rl:${key}`;
  const resetAt = now + windowSeconds;

  const redis = await getRedis();
  if (redis) {
    try {
      const count = await redis.incr(fullKey);
      if (count === 1) {
        await redis.expire(fullKey, windowSeconds);
      }
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
      };
    } catch (err) {
      console.warn("[rate-limit] redis error, falling back:", err);
    }
  }

  // In-memory fallback
  const existing = memoryStore.get(fullKey);
  if (!existing || existing.resetAt <= now) {
    memoryStore.set(fullKey, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  const newCount = existing.count + 1;
  existing.count = newCount;
  return {
    allowed: newCount <= limit,
    remaining: Math.max(0, limit - newCount),
    resetAt: existing.resetAt,
  };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}