import { logger } from '@/lib/logger';
// Simple in-memory cache for development
// In production, use Redis or Upstash

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    // Check memory cache first
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiry) {
        return entry.data as T;
      }
      // Expired, remove it
      memoryCache.delete(key);
    }
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set data in cache
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const { ttl = 3600 } = options; // Default 1 hour
    const expiry = Date.now() + (ttl * 1000);

    memoryCache.set(key, { data, expiry });

    // Clean up expired entries periodically
    if (memoryCache.size > 1000) {
      cleanupCache();
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
}

/**
 * Delete cache entry
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    memoryCache.delete(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
}

/**
 * Invalidate cache by tags
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    // In a real Redis setup, this would use SADD/SMEMBERS
    // For now, we'll clear all cache with this tag in memory
    for (const [key, entry] of memoryCache.entries()) {
      // Simple implementation - clear everything for now
      // In production, store tags with each entry
    }
    memoryCache.clear();
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
}

/**
 * Cache wrapper for functions
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await setCache(key, result, options);
  return result;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now >= entry.expiry) {
      memoryCache.delete(key);
    }
  }
}
