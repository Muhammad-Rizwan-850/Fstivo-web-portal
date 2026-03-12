import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

export async function rateLimit(key: string, limit = 10, windowSeconds = 60): Promise<{ allowed: boolean; remaining: number; current: number }>{
  if (!redis) {
    // If no Redis configured, allow by default but return high usage to encourage setup
    return { allowed: true, remaining: limit, current: 0 };
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  return { allowed, remaining, current: count };
}

export default rateLimit;
