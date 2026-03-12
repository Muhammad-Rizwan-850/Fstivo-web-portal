'use server';

/**
 * HTTP Caching Middleware
 * Adds X-Cache headers and manages HTTP caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from './redis';
import { logger } from '@/lib/logger';

// =====================================================
// CONFIGURATION
// =====================================================

interface CacheConfig {
  ttl?: number;
  skipCache?: boolean;
  revalidate?: number;
  tags?: string[];
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300, // 5 minutes
  skipCache: false,
};

// Route-specific cache configurations
const ROUTE_CACHE_CONFIG: Record<string, CacheConfig> = {
  '/api/events': { ttl: 300 },           // 5 minutes
  '/api/events/[id]': { ttl: 600 },      // 10 minutes
  '/api/tickets': { ttl: 180 },          // 3 minutes
  '/api/users/[id]': { ttl: 3600 },      // 1 hour
  '/api/analytics': { ttl: 600 },        // 10 minutes
  '/api/search': { ttl: 60 },            // 1 minute
};

// =====================================================
// CACHE KEY GENERATION
// =====================================================

export function generateCacheKey(request: NextRequest): string {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = url.searchParams ? new URLSearchParams([...url.searchParams.entries()].sort()).toString() : '';
    
    // Include method for POST/PUT/DELETE
    const method = request.method;
    
    return `cache:${method}:${path}${searchParams ? `?${searchParams}` : ''}`;
  } catch (error) {
    // Fallback for invalid URLs
    return `cache:${request.method}:${request.url}`;
  }
}

// =====================================================
// CACHE CHECK MIDDLEWARE
// =====================================================

export async function checkCache(request: NextRequest): Promise<NextResponse | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return null;
  }
  
  // Skip caching for dynamic routes
  if (path.includes('/api/auth/') || path.includes('/api/webhooks/')) {
    return null;
  }
  
  // Get route-specific config
  const config = getRouteConfig(path);
  
  if (config.skipCache) {
    return null;
  }
  
  const cacheKey = generateCacheKey(request);
  
  // Try Redis cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `max-age=${config.ttl || 300}`,
      },
    });
  }
  
  return null;
}

// =====================================================
// CACHE STORAGE
// =====================================================

export async function storeCache(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only cache successful GET requests
  if (request.method !== 'GET' || response.status !== 200) {
    return;
  }
  
  const config = getRouteConfig(path);
  
  if (config.skipCache) {
    return;
  }
  
  try {
    const data = await response.json();
    const cacheKey = generateCacheKey(request);
    
    await cache.set(cacheKey, data, config.ttl);
  } catch (error) {
    logger.error('Failed to cache response:', error);
  }
}

// =====================================================
// CACHE INVALIDATION
// =====================================================

export async function invalidatePattern(pattern: string): Promise<number> {
  return await cache.mdel('cache:*' + pattern + '*');
}

export async function invalidateKey(key: string): Promise<boolean> {
  return await cache.del(key);
}

export async function invalidateTags(tags: string[]): Promise<void> {
  // Invalidate all cache keys with given tags
  for (const tag of tags) {
    await invalidatePattern(tag);
  }
}

// =====================================================
// CACHE HELPERS
// =====================================================

function getRouteConfig(path: string): CacheConfig {
  // Check for exact match
  if (ROUTE_CACHE_CONFIG[path]) {
    return ROUTE_CACHE_CONFIG[path];
  }
  
  // Check for pattern match
  for (const [route, config] of Object.entries(ROUTE_CACHE_CONFIG)) {
    if (path.match(new RegExp('^' + route.replace('*', '.*') + '$'))) {
      return config;
    }
  }
  
  return DEFAULT_CACHE_CONFIG;
}

export function isCacheableResponse(response: NextResponse): boolean {
  const contentType = response.headers.get('content-type');
  
  // Only cache JSON responses
  if (!contentType?.includes('application/json')) {
    return false;
  }
  
  // Don't cache errors
  if (response.status >= 400) {
    return false;
  }
  
  return true;
}

export function getCacheStatus(request: NextRequest): 'HIT' | 'MISS' | 'SKIP' {
  const path = new URL(request.url).pathname;
  
  if (request.method !== 'GET') {
    return 'SKIP';
  }
  
  if (path.includes('/api/auth/') || path.includes('/api/webhooks/')) {
    return 'SKIP';
  }
  
  return 'MISS';
}

// =====================================================
// HEADERS UTILITIES
// =====================================================

export function getCacheHeaders(ttl: number): Record<string, string> {
  return {
    'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
    'CDN-Cache-Control': `public, s-maxage=${ttl * 60}`,
    'Vary': 'Accept-Encoding',
  };
}

export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// =====================================================
// EXPORTS
// =====================================================

export const httpCache = {
  checkCache,
  storeCache,
  invalidatePattern,
  invalidateKey,
  invalidateTags,
  getCacheStatus,
  getCacheHeaders,
  getNoCacheHeaders,
};

export default httpCache;
