/**
 * Idempotency Store
 * ─────────────────
 * Audit: "Comprehensive webhook replay protection across providers —
 * centralized idempotency store for all payment webhooks (Redis-backed)."
 *
 * How it works:
 *   1. Each payment webhook has a unique event_id (Stripe event.id,
 *      JazzCash pp_TxnRefNo, EasyPaisa transaction_id).
 *   2. Before processing, check if we've seen this event_id before.
 *   3. If yes → return 200 immediately (idempotent).
 *   4. If no → process, then mark as seen (store for 7 days).
 *
 * Uses Redis when available; falls back to Supabase webhook_logs table
 * (which already has a unique index on provider + event_id).
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ── Redis path (when available) ───────────────────────────────────────── */
let redis: any = null;

async function getRedis() {
  if (redis) return redis;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return redis;
    } catch {
      // Redis not installed — fall back to Supabase
      return null;
    }
  }
  return null;
}

/* ── Public API ────────────────────────────────────────────────────────── */

/**
 * Check if this event has already been processed.
 * Returns true if it's a duplicate (caller should return 200 immediately).
 */
export async function isDuplicate(
  provider: string,
  eventId: string
): Promise<boolean> {
  const key = `idempotency:${provider}:${eventId}`;

  // Try Redis first
  const r = await getRedis();
  if (r) {
    const exists = await r.get(key);
    return exists !== null;
  }

  // Fall back to Supabase (check webhook_logs unique index)
  const { data } = await supabase
    .from('webhook_logs')
    .select('id')
    .eq('provider', provider)
    .eq('event_id', eventId)
    .maybeSingle();

  return data !== null;
}

/**
 * Mark this event as processed.
 * Store for 7 days (604800 seconds) so we can detect replays for a week.
 */
export async function markProcessed(
  provider: string,
  eventId: string
): Promise<void> {
  const key = `idempotency:${provider}:${eventId}`;
  const TTL_SECONDS = 604800;  // 7 days

  const r = await getRedis();
  if (r) {
    await r.setex(key, TTL_SECONDS, '1');
  }

  // Also insert into webhook_logs (Phase 6 already does this, but ensure it)
  // The unique index on (provider, event_id) prevents duplicates
  await supabase
    .from('webhook_logs')
    .insert({
      provider,
      event_id: eventId,
      event_type: 'idempotency_marker',
      payload: {},
      verified: true,
      processed: true,
    })
    .select('id')
    .maybeSingle();
}
