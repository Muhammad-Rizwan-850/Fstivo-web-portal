import { logger } from '@/lib/logger';
// =====================================================
// FSTIVO CACHING LAYER - REDIS CONFIGURATION
// =====================================================
// Redis caching for improved performance
// Falls back to in-memory cache if Redis unavailable
// =====================================================

// Type declaration for ioredis (optional dependency)
type Redis = any;

// Mock Redis constructor for when ioredis is not available
const MockRedis = class {
  constructor() {
    throw new Error('Redis not available - install ioredis package');
  }
};

// =====================================================
// REDIS CLIENT CONFIGURATION
// =====================================================

// =====================================================
// REDIS CLIENT CONFIGURATION
// =====================================================

let redisClient: Redis | null = null;
let useFallback = false;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis | null {
  // If Redis is disabled, return null
  if (process.env.REDIS_ENABLED === 'false') {
    logger.info('Redis caching disabled');
    useFallback = true;
    return null;
  }

  // Check if Redis credentials are configured
  const redisHost = process.env.REDIS_HOST;
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisHost) {
    logger.warn('Redis not configured, using in-memory cache fallback');
    useFallback = true;
    return null;
  }

  try {
    // Try to use real Redis if available
    const RedisClass = (global as any).Redis || MockRedis;
    const redis = new RedisClass({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redis.on('error', (error: any) => {
      logger.error('Redis error:', error);
      useFallback = true;
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
      useFallback = false;
    });

    // Test connection
    redis.connect().catch((error: any) => {
      logger.error('Redis connection failed:', error);
      useFallback = true;
    });

    redisClient = redis;
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    useFallback = true;
    return null;
  }
}

/**
 * Get Redis client (lazy initialization)
 */
export function getRedis(): Redis | null {
  if (!redisClient) {
    return initRedis();
  }

  // Check connection status
  if (redisClient.status === 'ready') {
    return redisClient;
  }

  return null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  const redis = getRedis();
  return redis !== null && redis.status === 'ready' && !useFallback;
}

// =====================================================
// CACHE KEY PATTERNS
// =====================================================

export const CacheKeys = {
  // Event-related
  event: (id: string) => `event:${id}`,
  eventDetails: (id: string) => `event:${id}:details`,
  eventList: (filters: string) => `events:list:${filters}`,
  eventRegistrations: (eventId: string) => `event:${eventId}:registrations`,

  // User-related
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userRegistrations: (userId: string) => `user:${userId}:registrations`,
  userTickets: (userId: string) => `user:${userId}:tickets`,

  // Showcase pages
  showcasePastEvents: 'showcase:past-events',
  showcaseSponsors: 'showcase:sponsors',
  showcaseTeam: 'showcase:team',
  showcasePartners: 'showcase:partners',

  // Analytics
  analyticsOverview: (eventId: string) => `analytics:${eventId}:overview`,
  analyticsRevenue: (eventId: string) => `analytics:${eventId}:revenue`,
  analyticsFunnel: (eventId: string) => `analytics:${eventId}:funnel`,
  analyticsDashboard: (eventId: string) => `analytics:${eventId}:dashboard`,

  // Search results
  searchEvents: (query: string, filters: string) => `search:events:${query}:${filters}`,
  searchAttendees: (eventId: string, query: string) => `search:attendees:${eventId}:${query}`,

  // Rate limiting
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,

  // Sessions
  session: (sessionId: string) => `session:${sessionId}`,

  // Webhook tracking
  webhook: (provider: string, eventId: string) => `webhook:${provider}:${eventId}`,

  // Seating
  seatingMap: (eventId: string) => `seating:${eventId}:map`,
  seatAvailability: (eventId: string) => `seating:${eventId}:availability`,
};

// =====================================================
// CACHE TTL (Time To Live) CONSTANTS
// =====================================================

export const CacheTTL = {
  IMMEDIATE: 1, // 1 second
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
  WEEK: 604800, // 1 week
  MONTH: 2592000, // 1 month
};

// =====================================================
// CACHE OPERATIONS
// =====================================================

/**
 * Get value from cache
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  const redis = getRedis();

  if (!redis) {
    // Fallback to memory cache
    return memoryCache.get(key) as T | null;
  }

  try {
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache<T = any>(
  key: string,
  value: T,
  ttl: number = CacheTTL.MEDIUM
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    // Fallback to memory cache
    memoryCache.set(key, value, ttl);
    return;
  }

  try {
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    logger.error('Cache set error:', error);
    // Fallback to memory cache
    memoryCache.set(key, value, ttl);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    memoryCache.delete(key);
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
    memoryCache.delete(key);
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    // Clear all memory cache (not ideal, but safe)
    memoryCache.clear();
    return;
  }

  try {
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Cache delete pattern error:', error);
  }
}

/**
 * Check if key exists in cache
 */
export async function hasCache(key: string): Promise<boolean> {
  const redis = getRedis();

  if (!redis) {
    return memoryCache.has(key);
  }

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache has error:', error);
    return false;
  }
}

// =====================================================
// CACHE DECORATOR (for functions)
// =====================================================

/**
 * Decorator to cache function results
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyFn: (...args: Parameters<T>) => string,
  ttl: number = CacheTTL.MEDIUM
) {
  return async function (
    fn: T,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    const key = keyFn(...args);

    // Try to get from cache
    const cached = await getCache<Awaited<ReturnType<T>>>(key);

    if (cached !== null) {
      return cached as ReturnType<T>;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    await setCache(key, result, ttl);

    return result;
  };
}

// =====================================================
// CACHE INVALIDATION HELPERS
// =====================================================

/**
 * Invalidate all event-related caches
 */
export async function invalidateEventCache(eventId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    memoryCache.clear();
    return;
  }

  try {
    const pattern = `*event:${eventId}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Event cache invalidation error:', error);
  }
}

/**
 * Invalidate all user-related caches
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    memoryCache.clear();
    return;
  }

  try {
    const pattern = `*user:${userId}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('User cache invalidation error:', error);
  }
}

/**
 * Invalidate all caches for a pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  await deleteCachePattern(pattern);
}

// =====================================================
// IN-MEMORY FALLBACK CACHE
// =====================================================

class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();

  set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCache();

// Cleanup memory cache every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

// =====================================================
// CACHE STATISTICS
// =====================================================

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  redisAvailable: boolean;
}

let cacheHits = 0;
let cacheMisses = 0;

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const redis = getRedis();

  const totalKeys = memoryCache['cache'].size;
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

  let redisKeys = 0;

  if (redis && redis.status === 'ready') {
    try {
      const info = await redis.info('keyspace');
      const match = info.match(/keys=(\d+)/);
      redisKeys = match ? parseInt(match[1]) : 0;
    } catch {
      // Ignore
    }
  }

  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate,
    totalKeys: totalKeys + redisKeys,
    memoryUsage,
    redisAvailable: redis !== null && redis.status === 'ready',
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  initRedis,
  getRedis,
  isRedisAvailable,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  hasCache,
  cached,
  invalidateEventCache,
  invalidateUserCache,
  invalidatePattern,
  getCacheStats,
  resetCacheStats,
};

export { memoryCache };
