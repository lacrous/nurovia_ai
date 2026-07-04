/**
 * Redis client — Upstash-compatible, lazy-init.
 *
 * If REDIS_URL is set, the rate limiter uses it. Otherwise falls back to in-memory.
 */

type RedisLike = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  on?(event: string, cb: (...args: any[]) => void): unknown;
  connect?(): Promise<void>;
  quit?(): Promise<void>;
};

let _redisClient: RedisLike | null = null;
let _redisInitPromise: Promise<RedisLike | null> | null = null;

async function initRedis(): Promise<RedisLike | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const mod: any = await import("redis");
    const Redis = mod.default;
    const client: RedisLike = Redis.createClient({ url });
    client.on?.("error", (err: Error) => console.warn("[redis] error:", err.message));
    await client.connect?.();
    console.log("[redis] connected");
    return client;
  } catch (err) {
    console.warn("[redis] failed to init, using in-memory fallback:", err);
    return null;
  }
}

export async function getRedis(): Promise<RedisLike | null> {
  if (_redisClient) return _redisClient;
  if (!_redisInitPromise) {
    _redisInitPromise = initRedis().then((c) => {
      _redisClient = c;
      return c;
    });
  }
  return _redisInitPromise;
}