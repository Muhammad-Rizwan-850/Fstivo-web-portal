/**
 * GET /api/health
 * ───────────────
 * Audit: "Health & readiness endpoints for infra dependencies — useful for
 * k8s readiness."
 *
 * Returns:
 *   200 if all critical services are up (Supabase, Redis if enabled, Stripe)
 *   503 if any critical service is down
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: Record<string, { status: string; latency?: number }> = {};

  /* ── Supabase ────────────────────────────────────────────────────────── */
  try {
    const start = Date.now();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    results.supabase = { status: 'up', latency: Date.now() - start };
  } catch (err) {
    results.supabase = { status: 'down' };
  }

  /* ── Redis (if enabled) ──────────────────────────────────────────────── */
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const start = Date.now();
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      results.redis = { status: 'up', latency: Date.now() - start };
    } catch (err) {
      results.redis = { status: 'down' };
    }
  } else {
    results.redis = { status: 'not_configured' };
  }

  /* ── Stripe ──────────────────────────────────────────────────────────── */
  try {
    const start = Date.now();
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia' as any,
    });
    // lightweight call to verify API key
    await stripe.balanceTransactions.list({ limit: 1 });
    results.stripe = { status: 'up', latency: Date.now() - start };
  } catch (err) {
    results.stripe = { status: 'down' };
  }

  /* ── Overall status ──────────────────────────────────────────────────── */
  const critical = ['supabase', 'stripe'];
  const allUp = critical.every(svc => results[svc]?.status === 'up');

  return NextResponse.json(
    { healthy: allUp, services: results },
    { status: allUp ? 200 : 503 }
  );
}
