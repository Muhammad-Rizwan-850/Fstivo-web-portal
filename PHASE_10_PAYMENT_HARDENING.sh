#!/usr/bin/env bash
# ============================================================================
# PHASE 10 — PAYMENT HARDENING
# Audit: "Payment & webhook reliability" · "Idempotency absent" · "Error handling unclear"
#        "Health & readiness endpoints missing"
# Run from:  cd /path/to/fstivo && bash PHASE_10_PAYMENT_HARDENING.sh
# ============================================================================
set -euo pipefail

R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' C='\033[0;36m' N='\033[0m'
mkdir -p src/lib/payments/idempotency src/app/api/health

step()  { echo -e "${B}▶ $*${N}"; }
ok()    { echo -e "  ${G}✔ $*${N}"; }
warn()  { echo -e "  ${Y}⚠ $*${N}"; }

[[ ! -f package.json ]] && echo -e "${R}✘ Run from project root${N}" && exit 1

echo -e "\n${C}═══════════════════════════════════════════════════${N}"
echo -e "${C}   PHASE 10 — PAYMENT HARDENING                     ${N}"
echo -e "${C}═══════════════════════════════════════════════════${N}\n"

# ============================================================================
# 10A — Redis-backed idempotency store
# ============================================================================
step "10A · Creating Redis-backed idempotency store"

cat > src/lib/payments/idempotency/store.ts << 'TSEOF'
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
TSEOF

ok "Created src/lib/payments/idempotency/store.ts"

# ============================================================================
# 10B — Wrap existing payment webhooks with idempotency check
# ============================================================================
step "10B · Writing idempotency wrapper for webhooks"

cat > src/lib/payments/idempotency/wrapper.ts << 'TSEOF'
/**
 * Idempotency Wrapper for Webhook Routes
 * ───────────────────────────────────────
 * Drop-in replacement for Phase 6's audit-trail wrapper.
 * Adds idempotency check BEFORE processing.
 *
 * Usage (replace existing withAuditTrail):
 *
 *   import { withIdempotency } from '@/lib/payments/idempotency/wrapper';
 *
 *   export const POST = withIdempotency('stripe', async (request, logId) => {
 *     // your webhook handler body
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDuplicate, markProcessed } from './store';

type Handler = (request: NextRequest, logId: string) => Promise<void>;

export function withIdempotency(provider: string, handler: Handler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    /* ── 1. extract event_id from payload ────────────────────────── */
    const rawBody = await request.text();
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(rawBody); } catch { /* keep empty */ }

    const eventId =
      (payload.id as string | undefined) ??              // Stripe
      (payload.pp_TxnRefNo as string | undefined) ??     // JazzCash
      (payload.transaction_id as string | undefined) ??  // EasyPaisa
      null;

    if (!eventId) {
      console.warn(`[${provider}] No event_id in payload — cannot enforce idempotency`);
      // proceed anyway (non-critical)
    }

    /* ── 2. idempotency check ──────────────────────────────────── */
    if (eventId) {
      const dup = await isDuplicate(provider, eventId);
      if (dup) {
        console.info(`[${provider}] Duplicate event ${eventId} — returning 200`);
        return NextResponse.json({ status: 'duplicate' }, { status: 200 });
      }
    }

    /* ── 3. call the actual handler ────────────────────────────── */
    try {
      // Re-construct request so handler can call request.text() again
      const syntheticRequest = new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: rawBody,
      });

      const logId = 'webhook-log-id';  // Phase 6's audit-trail would provide this
      await handler(syntheticRequest, logId);

      /* ── 4. mark as processed ────────────────────────────────── */
      if (eventId) {
        await markProcessed(provider, eventId);
      }

      return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[${provider}] Webhook processing failed:`, msg);

      // Return 500 so the provider retries (we did NOT mark as processed)
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}
TSEOF

ok "Created src/lib/payments/idempotency/wrapper.ts"

# ============================================================================
# 10C — Structured error responses for payment routes
# ============================================================================
step "10C · Creating structured error response helper"

cat > src/lib/payments/error-responses.ts << 'TSEOF'
/**
 * Structured Payment Error Responses
 * ───────────────────────────────────
 * Audit: "Unclear error handling in several API routes — generic errors or
 * log nulls without actionable fallbacks."
 *
 * This module standardizes payment error responses so:
 *   • Errors are JSON with a clear `error` + `code` field
 *   • User-facing messages are safe (no secrets leaked)
 *   • Server logs get the full stack trace
 */

export interface PaymentError {
  error:   string;           // user-facing message
  code:    string;           // machine-readable code
  details?: Record<string, unknown>;  // optional debug info (dev only)
}

export const ErrorCodes = {
  AUTH_FAILED:           'AUTH_FAILED',
  INVALID_AMOUNT:        'INVALID_AMOUNT',
  PAYMENT_PROVIDER_DOWN: 'PAYMENT_PROVIDER_DOWN',
  WEBHOOK_SIG_INVALID:   'WEBHOOK_SIG_INVALID',
  ORDER_NOT_FOUND:       'ORDER_NOT_FOUND',
  DUPLICATE_PAYMENT:     'DUPLICATE_PAYMENT',
  INSUFFICIENT_BALANCE:  'INSUFFICIENT_BALANCE',
  INTERNAL_ERROR:        'INTERNAL_ERROR',
} as const;

/**
 * Build a standardized error response.
 * Logs the full error server-side; returns safe message to client.
 */
export function paymentError(
  code: keyof typeof ErrorCodes,
  userMessage: string,
  internalError?: unknown
): Response {
  // Log full details server-side
  if (internalError) {
    console.error(`[PaymentError ${code}]`, internalError);
  }

  // Return safe JSON to client
  const payload: PaymentError = {
    error: userMessage,
    code:  ErrorCodes[code],
  };

  // In dev mode, include stack trace
  if (process.env.NODE_ENV === 'development' && internalError instanceof Error) {
    payload.details = { stack: internalError.stack };
  }

  const statusMap: Record<string, number> = {
    AUTH_FAILED:           401,
    INVALID_AMOUNT:        400,
    PAYMENT_PROVIDER_DOWN: 503,
    WEBHOOK_SIG_INVALID:   401,
    ORDER_NOT_FOUND:       404,
    DUPLICATE_PAYMENT:     409,
    INSUFFICIENT_BALANCE:  402,
    INTERNAL_ERROR:        500,
  };

  return new Response(JSON.stringify(payload), {
    status: statusMap[code] ?? 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
TSEOF

ok "Created src/lib/payments/error-responses.ts"

# ============================================================================
# 10D — Health check endpoints
# ============================================================================
step "10D · Creating health check endpoints"

cat > src/app/api/health/route.ts << 'TSEOF'
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
TSEOF

ok "Created src/app/api/health/route.ts"

# Kubernetes-friendly readiness probe
mkdir -p src/app/api/health/ready
cat > src/app/api/health/ready/route.ts << 'TSEOF'
/**
 * GET /api/health/ready
 * ─────────────────────
 * Kubernetes readiness probe.
 * Returns 200 only if the app can serve traffic (DB reachable).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ ready: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503 });
  }
}
TSEOF

ok "Created src/app/api/health/ready/route.ts"

# Liveness probe (always returns 200 unless the process crashed)
mkdir -p src/app/api/health/live
cat > src/app/api/health/live/route.ts << 'TSEOF'
/**
 * GET /api/health/live
 * ────────────────────
 * Kubernetes liveness probe.
 * Returns 200 as long as the Node.js process is running.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ alive: true }, { status: 200 });
}
TSEOF

ok "Created src/app/api/health/live/route.ts"

# ============================================================================
# 10E — Update existing payment routes to use structured errors
# ============================================================================
step "10E · Writing migration guide for payment routes"

cat > PAYMENT_ERROR_MIGRATION.md << 'MDEOF'
# Payment Error Migration Guide

**Audit**: "Unclear error handling in several API routes."

---

## Before (current pattern)

```typescript
// src/app/api/payments/jazzcash/create/route.ts
export async function POST(request: Request) {
  try {
    // … logic
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

**Problems**:
- Generic "Something went wrong" message
- No machine-readable error code
- Stack trace exposed in dev mode (unsafe)

---

## After (structured errors)

```typescript
import { paymentError, ErrorCodes } from '@/lib/payments/error-responses';

export async function POST(request: Request) {
  try {
    const { orderId, amount } = await request.json();

    if (!orderId || amount <= 0) {
      return paymentError('INVALID_AMOUNT', 'Amount must be positive');
    }

    // … call JazzCash API
    const response = await jazzCashClient.createPayment({ … });

    if (!response.ok) {
      return paymentError('PAYMENT_PROVIDER_DOWN', 'JazzCash is temporarily unavailable', response.error);
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (err) {
    return paymentError('INTERNAL_ERROR', 'An unexpected error occurred', err);
  }
}
```

**Benefits**:
- Clear user-facing message
- Machine-readable `code` field for client retry logic
- Full stack trace logged server-side
- No secrets leaked to client

---

## Files to Update

Apply this pattern to:

1. `src/app/api/payments/jazzcash/create/route.ts`
2. `src/app/api/payments/easypaisa/create/route.ts`
3. `src/app/api/webhooks/stripe/route.ts`
4. `src/app/api/webhooks/jazzcash/return/route.ts`
5. `src/app/api/webhooks/easypaisa/return/route.ts`

Grep for generic error handling:
```bash
grep -rn "return.*error.*'Something went wrong'" src/app/api/payments/
```

---

**Estimate**: 2-3 hours to update all payment routes.
MDEOF

ok "Created PAYMENT_ERROR_MIGRATION.md"

# ── summary ──
echo ""
echo -e "${G}═══════════════════════════════════════════════════${N}"
echo -e "${G}   PHASE 10 COMPLETE                                ${N}"
echo -e "${G}═══════════════════════════════════════════════════${N}"
echo -e "  ${G}✔${N} Idempotency store      — Redis + Supabase fallback, 7-day TTL"
echo -e "  ${G}✔${N} Idempotency wrapper    — drop-in for webhooks, replay detection"
echo -e "  ${G}✔${N} Structured errors      — safe user messages, full server logs"
echo -e "  ${G}✔${N} Health checks          — /health, /health/ready, /health/live"
echo -e "  ${G}✔${N} Migration guide        — how to update payment routes"
echo -e "  ${Y}▸${N} Wire idempotency into all webhook routes (see wrapper usage)"
echo -e "  ${Y}▸${N} Add k8s probes: readinessProbe: httpGet: /api/health/ready"
echo -e "  ${Y}▸${N} All 10 phases complete — run  bash run_all.sh  for the full suite"
echo ""
