/**
 * Webhook Idempotency Helper
 * Prevents duplicate processing of webhook events (e.g., if webhook is retried)
 * Uses Redis for distributed idempotency across multiple instances
 */

import { isRedisConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';

interface IdempotencyKey {
  provider: string;
  eventId: string;
  timestamp: number;
}

/**
 * Check if webhook has been processed before
 */
export async function isWebhookProcessed(key: IdempotencyKey): Promise<boolean> {
  if (!isRedisConfigured()) {
    logger.warn('Webhook idempotency: Redis not configured, skipping duplicate check');
    return false;
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return false;
    }

    const idempotencyKey = `webhook:${key.provider}:${key.eventId}`;

    // Check if key exists
    const response = await fetch(`${redisUrl}/get/${encodeURIComponent(idempotencyKey)}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    if (!response.ok) {
      logger.error('Redis GET failed', { status: response.status });
      return false;
    }

    const data = await response.json();
    return data.result !== null; // Key exists = already processed
  } catch (error) {
    logger.error('Error checking webhook idempotency:', error);
    // On error, allow processing (safe default)
    return false;
  }
}

/**
 * Mark webhook as processed with TTL
 */
export async function markWebhookProcessed(key: IdempotencyKey, ttlSeconds: number = 86400): Promise<boolean> {
  if (!isRedisConfigured()) {
    return true; // Silently succeed if Redis not configured
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return false;
    }

    const idempotencyKey = `webhook:${key.provider}:${key.eventId}`;

    // Set key with TTL using EX option
    const response = await fetch(`${redisUrl}/set/${encodeURIComponent(idempotencyKey)}/processed/EX/${ttlSeconds}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    logger.error('Error marking webhook as processed:', error);
    return false;
  }
}

/**
 * Middleware: Check and mark webhook as processed
 * Usage: Call at start of webhook handler
 */
export async function ensureWebhookIdempotency(
  provider: string,
  eventId: string
): Promise<{ isDuplicate: boolean; error?: string }> {
  // Check if already processed
  const processed = await isWebhookProcessed({
    provider,
    eventId,
    timestamp: Date.now(),
  });

  if (processed) {
    logger.warn(`Webhook duplicate detected`, { provider, eventId });
    return { isDuplicate: true };
  }

  // Mark as processed
  const marked = await markWebhookProcessed(
    {
      provider,
      eventId,
      timestamp: Date.now(),
    },
    86400 // 24 hour TTL
  );

  if (!marked) {
    return {
      isDuplicate: false,
      error: 'Failed to mark webhook as processed',
    };
  }

  return { isDuplicate: false };
}
