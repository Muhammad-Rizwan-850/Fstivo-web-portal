'use server';

/**
 * FSTIVO Redis Client - Upstash Integration
 * Complete Redis caching layer with typed operations
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// =====================================================
// CONFIGURATION
// =====================================================

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  logger.warn('⚠️  Redis credentials not found. Caching will be disabled.');
}

let redis: Redis | null = null;

try {
  redis = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  });
} catch (error) {
  logger.error('❌ Failed to initialize Redis:', error);
}

// =====================================================
// CACHE TTL CONSTANTS
// =====================================================

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  DAY: 86400,       // 1 day
  WEEK: 604800,     // 1 week
} as const;

// =====================================================
// CORE REDIS OPERATIONS
// =====================================================

/**
 * Get value from cache
 */
export async function get<T = any>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    logger.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
  if (!redis) return false;
  
  try {
    const data = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, data);
    } else {
      await redis.set(key, data);
    }
    return true;
  } catch (error) {
    logger.error('Redis SET error:', error);
    return false;
  }
}

/**
 * Delete key from cache
 */
export async function del(key: string | string[]): Promise<boolean> {
  if (!redis) return false;
  
  try {
    if (Array.isArray(key)) {
      await redis.del(...key);
    } else {
      await redis.del(key);
    }
    return true;
  } catch (error) {
    logger.error('Redis DEL error:', error);
    return false;
  }
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  if (!redis) return false;
  
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Redis EXISTS error:', error);
    return false;
  }
}

/**
 * Increment counter
 */
export async function incr(key: string, amount: number = 1): Promise<number | null> {
  if (!redis) return null;
  
  try {
    if (amount === 1) {
      return await redis.incr(key);
    } else {
      return await redis.incrby(key, amount);
    }
  } catch (error) {
    logger.error('Redis INCR error:', error);
    return null;
  }
}

/**
 * Get all keys matching pattern
 */
export async function keys(pattern: string): Promise<string[]> {
  if (!redis) return [];
  
  try {
    return await redis.keys(pattern);
  } catch (error) {
    logger.error('Redis KEYS error:', error);
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getStats(): Promise<{
  total: number;
  hits: number;
  misses: number;
  hitRate: number;
}> {
  if (!redis) {
    return { total: 0, hits: 0, misses: 0, hitRate: 0 };
  }
  
  try {
    const info = await (redis as any).info('stats');
    const stats = {
      total: (info.keyspace_hits || 0) + (info.keyspace_misses || 0),
      hits: info.keyspace_hits || 0,
      misses: info.keyspace_misses || 0,
    };
    
    return {
      ...stats,
      hitRate: stats.total > 0 ? (stats.hits / stats.total) * 100 : 0,
    };
  } catch (error) {
    logger.error('Redis STATS error:', error);
    return { total: 0, hits: 0, misses: 0, hitRate: 0 };
  }
}

/**
 * Flush all cache
 */
export async function flush(): Promise<boolean> {
  if (!redis) return false;
  
  try {
    await redis.flushall();
    return true;
  } catch (error) {
    logger.error('Redis FLUSH error:', error);
    return false;
  }
}

/**
 * Get memory usage
 */
export async function getMemoryUsage(): Promise<number> {
  if (!redis) return 0;
  
  try {
    const info = await (redis as any).info('memory');
    return info.used_memory || 0;
  } catch (error) {
    logger.error('Redis MEMORY error:', error);
    return 0;
  }
}

// =====================================================
// CACHE PATTERN HELPERS
// =====================================================

/**
 * Cache-Aside Pattern: Get or Fetch
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - fetch and store
  const value = await fetchFn();
  await set(key, value, ttl);
  
  return value;
}

/**
 * Write-Through Pattern: Write to both cache and DB
 */
export async function writeThrough<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  return await set(key, value, ttl);
}

/**
 * Write-Behind Pattern: Update cache asynchronously
 */
export async function writeBehind<T>(
  key: string,
  value: T
): Promise<void> {
  // Non-blocking cache update
  set(key, value).catch(error => {
    logger.error('Write-behind cache update failed:', error);
  });
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Get multiple values
 */
export async function mget<T = any>(keys: string[]): Promise<(T | null)[]> {
  if (!redis || keys.length === 0) return [];
  
  try {
    const values = await redis.mget(...keys);
    return values.map(v => v ? JSON.parse(v as string) : null);
  } catch (error) {
    logger.error('Redis MGET error:', error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple values
 */
export async function mset<T = any>(
  items: Array<{ key: string; value: T; ttl?: number }>
): Promise<boolean> {
  if (!redis || items.length === 0) return false;
  
  try {
    // Use pipeline for efficiency
    const pipeline = redis.pipeline();
    
    for (const item of items) {
      const data = JSON.stringify(item.value);
      if (item.ttl) {
        pipeline.setex(item.key, item.ttl, data);
      } else {
        pipeline.set(item.key, data);
      }
    }
    
    await pipeline.exec();
    return true;
  } catch (error) {
    logger.error('Redis MSET error:', error);
    return false;
  }
}

/**
 * Delete multiple keys
 */
export async function mdel(pattern: string): Promise<number> {
  if (!redis) return 0;
  
  try {
    const keysToDelete = await keys(pattern);
    if (keysToDelete.length === 0) return 0;
    
    await redis.del(...keysToDelete);
    return keysToDelete.length;
  } catch (error) {
    logger.error('Redis MDEL error:', error);
    return 0;
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const cache = {
  get,
  set,
  del,
  exists,
  incr,
  keys,
  getStats,
  flush,
  getMemoryUsage,
  getOrSet,
  writeThrough,
  writeBehind,
  mget,
  mset,
  mdel,
};

export default cache;
