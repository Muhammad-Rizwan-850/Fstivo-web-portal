// =====================================================
// FSTIVO SECURITY - RATE LIMITING
// =====================================================
// Prevents brute force attacks and API abuse
// In-memory implementation (use Redis in production)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// RATE LIMIT CONFIGURATION
// =====================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// =====================================================
// IN-MEMORY STORE (Use Redis in production)
// =====================================================

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// =====================================================
// RATE LIMITER CLASS
// =====================================================

export class RateLimiter {
  private config: RateLimitConfig;
  private prefix: string;

  constructor(config: RateLimitConfig, prefix: string = 'rate_limit') {
    this.config = config;
    this.prefix = prefix;
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    // Get identifier from IP or custom
    const key = this.getKey(request, identifier);
    const now = Date.now();

    // Get or create record
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // New window
      record = {
        count: 1,
        resetTime: now + this.config.windowMs,
        lastRequest: now,
      };
      rateLimitStore.set(key, record);

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: record.resetTime,
      };
    }

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      };
    }

    // Increment count
    record.count++;
    record.lastRequest = now;
    rateLimitStore.set(key, record);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(request: NextRequest, identifier?: string): void {
    const key = this.getKey(request, identifier);
    rateLimitStore.delete(key);
  }

  /**
   * Get rate limit key
   */
  private getKey(request: NextRequest, identifier?: string): string {
    if (identifier) {
      return `${this.prefix}:${identifier}`;
    }

    // Get IP from headers
    const ip = this.getClientIP(request);

    // Include route for more granular limiting
    const route = request.nextUrl.pathname;

    return `${this.prefix}:${ip}:${route}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }

  /**
   * Get remaining requests count
   */
  getRemaining(request: NextRequest, identifier?: string): number {
    const key = this.getKey(request, identifier);
    const record = rateLimitStore.get(key);

    if (!record || Date.now() > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }
}

// =====================================================
// PRE-CONFIGURED RATE LIMITERS
// =====================================================

// API routes (general)
export const apiRateLimiter = new RateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },
  'api'
);

// Authentication endpoints (strict)
export const authRateLimiter = new RateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  'auth'
);

// Payment endpoints (strict)
export const paymentRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 payment requests per minute
  },
  'payment'
);

// Webhook endpoints (generous)
export const webhookRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhooks per minute
  },
  'webhook'
);

// Public endpoints (moderate)
export const publicRateLimiter = new RateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 requests per 15 minutes
  },
  'public'
);

// Admin endpoints (very strict)
export const adminRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000, // 1000 requests per hour
  },
  'admin'
);

// Email sending (strict)
export const emailRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 emails per hour
  },
  'email'
);

// File upload (strict)
export const uploadRateLimiter = new RateLimiter(
  {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
  },
  'upload'
);

// =====================================================
// MIDDLEWARE FUNCTION
// =====================================================

export function rateLimit(limiter: RateLimiter) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await limiter.check(request);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const headers = new Headers({
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetTime),
    });

    return null;
  };
}

// =====================================================
// DECORATOR FOR API ROUTES
// =====================================================

/**
 * Apply rate limiting to API route handler
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await limiter.check(request);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime),
          },
        }
      );
    }

    // Call original handler
    const response = await handler(request);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));

    return response;
  };
}

// =====================================================
// REDIS-BASED RATE LIMITER (For production)
// =====================================================

/**
 * Redis-based rate limiter for distributed systems
 * This is a reference implementation
 */
export class RedisRateLimiter {
  private redis: any; // ioredis client
  private config: RateLimitConfig;
  private prefix: string;

  constructor(redis: any, config: RateLimitConfig, prefix: string = 'rate_limit') {
    this.redis = redis;
    this.config = config;
    this.prefix = prefix;
  }

  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    const key = this.getKey(request, identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(key);

    if (count >= this.config.maxRequests) {
      // Get oldest request time for reset time
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldest.length > 1 ? parseInt(oldest[1]) + this.config.windowMs : now + this.config.windowMs;

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        error: 'Rate limit exceeded',
      };
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry
    await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - count - 1,
      resetTime: now + this.config.windowMs,
    };
  }

  async reset(request: NextRequest, identifier?: string): Promise<void> {
    const key = this.getKey(request, identifier);
    await this.redis.del(key);
  }

  private getKey(request: NextRequest, identifier?: string): string {
    if (identifier) {
      return `${this.prefix}:${identifier}`;
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const route = request.nextUrl.pathname;

    return `${this.prefix}:${ip}:${route}`;
  }
}

// =====================================================
// EXPORTS
// =====================================================

// Classes and types are already exported at their declarations
