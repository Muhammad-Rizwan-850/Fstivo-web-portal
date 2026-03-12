import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  req: NextRequest,
  identifier: string,
  max: number = 10,
  windowMs: number = 60000
): Promise<void> {
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const key = identifier + '_' + ip;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= max) {
    throw new Error('Rate limit exceeded');
  }

  record.count++;
  rateLimitStore.set(key, record);
}

export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest, identifier: string) => {
    await rateLimit(req, identifier, config.max, config.windowMs);
  };
}

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
