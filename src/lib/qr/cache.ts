import { logger } from '@/lib/logger';
/**
 * QR Code Cache
 * In-memory cache with optional Redis support for production
 */

interface CacheEntry {
  data: Buffer | string
  timestamp: number
  expiresAt: number
}

class QRCodeCache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL = 1000 * 60 * 60 * 24 * 30 // 30 days in milliseconds
  private maxSize = 1000
  private cleanupInterval = 1000 * 60 * 60 // 1 hour

  constructor() {
    // Start periodic cleanup
    if (typeof window === 'undefined') {
      this.startCleanup()
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): Buffer | string | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set item in cache
   */
  set(key: string, data: Buffer | string, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)

    // Check cache size and evict oldest if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      logger.info(`[QR Cache] Cleaned up ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }
}

// Singleton instance
const qrCache = new QRCodeCache()

/**
 * Get QR code from cache or generate new one
 */
export async function getCachedQRCode(
  key: string,
  generator: () => Promise<Buffer>,
  ttl?: number
): Promise<Buffer> {
  // Check cache first
  const cached = qrCache.get(key)
  if (cached && Buffer.isBuffer(cached)) {
    return cached
  }

  // Generate new QR code
  const buffer = await generator()

  // Store in cache
  qrCache.set(key, buffer, ttl)

  return buffer
}

/**
 * Get QR code data URL from cache or generate new one
 */
export async function getCachedQRCodeDataURL(
  key: string,
  generator: () => Promise<string>,
  ttl?: number
): Promise<string> {
  // Check cache first
  const cached = qrCache.get(key)
  if (cached && typeof cached === 'string') {
    return cached
  }

  // Generate new QR code
  const dataURL = await generator()

  // Store in cache
  qrCache.set(key, dataURL, ttl)

  return dataURL
}

/**
 * Invalidate cached QR code
 */
export function invalidateQRCode(key: string): void {
  qrCache.delete(key)
}

/**
 * Clear all QR codes from cache
 */
export function clearQRCodeCache(): void {
  qrCache.clear()
}

/**
 * Get cache statistics
 */
export function getQRCodeCacheStats(): { size: number; keys: string[] } {
  return qrCache.getStats()
}

/**
 * Pre-generate and cache QR codes for a list of registration numbers
 */
export async function preloadQRCodes(
  registrationNumbers: string[],
  options?: { size?: number; ttl?: number }
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  const { generateQRCodeBuffer, getQRCodeCacheKey } = await import('@/lib/qr/generate')

  for (const registrationNumber of registrationNumbers) {
    try {
      const cacheKey = getQRCodeCacheKey(registrationNumber, { width: options?.size || 300 })

      await getCachedQRCode(
        cacheKey,
        () => generateQRCodeBuffer(registrationNumber, { width: options?.size || 300 }),
        options?.ttl
      )

      success++
    } catch (error) {
      logger.error(`[QR Cache] Failed to preload QR code for ${registrationNumber}:`, error)
      failed++
    }
  }

  logger.info(`[QR Cache] Preloaded ${success} QR codes, ${failed} failed`)

  return { success, failed }
}

// Export cache instance for advanced usage
export { qrCache }
