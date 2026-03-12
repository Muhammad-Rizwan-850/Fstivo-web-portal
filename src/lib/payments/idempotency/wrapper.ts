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
