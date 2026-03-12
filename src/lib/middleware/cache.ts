// ========== src/lib/middleware/cache.ts ==========
// Caching middleware for API routes

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '../cache/redis';

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean;
}

/**
 * API response caching middleware
 */
export function withCache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => req.url,
    skip = () => false,
  } = options;

  return async (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => {
    // Skip caching for non-GET requests or if skip condition is met
    if (req.method !== 'GET' || skip(req)) {
      return handler(req);
    }

    // Generate cache key
    const cacheKey = `api:${keyGenerator(req)}`;

    // Try to get cached response
    const cached = await cache.get<{
      data: any;
      headers: Record<string, string>;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
        },
      });
    }

    // Execute handler
    const response = await handler(req);

    // Cache successful responses
    if (response.ok) {
      const data = await response.clone().json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      await cache.set(cacheKey, { data, headers }, ttl);

      // Add cache header
      response.headers.set('X-Cache', 'MISS');
    }

    return response;
  };
}
