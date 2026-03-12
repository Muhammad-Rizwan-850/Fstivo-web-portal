// =====================================================
// PAYMENT WEBHOOK SECURITY
// =====================================================
// Verifies webhook signatures from payment providers
// Prevents fake webhook processing
// =====================================================

import crypto from 'crypto';
import { headers } from 'next/headers';
import { logger } from '@/lib/utils/logger';

interface WebhookVerificationOptions {
  provider: 'stripe' | 'jazzcash' | 'easypaisa';
  signature: string;
  payload: string | Buffer;
  secret: string;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(options: WebhookVerificationOptions): boolean {
  const { provider, signature, payload, secret } = options;

  try {
    switch (provider) {
      case 'stripe':
        return verifyStripeSignature(signature, payload, secret);
      case 'jazzcash':
        return verifyJazzcashSignature(signature, payload, secret);
      case 'easypaisa':
        return verifyEasyPaisaSignature(signature, payload, secret);
      default:
        logger.warn('Unknown webhook provider', { provider });
        return false;
    }
  } catch (error) {
    logger.error('Webhook signature verification failed', error as Error, { provider });
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(signature: string, payload: string | Buffer, secret: string): boolean {
  try {
    const Stripe = require('stripe');
    const webhookSecret = secret;

    Stripe.webhook.constructEvent(
      typeof payload === 'string' ? Buffer.from(payload) : payload,
      signature,
      webhookSecret
    );

    return true;
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', error as Error);
    return false;
  }
}

/**
 * Verify JazzCash webhook signature
 * Uses HMAC-SHA256
 */
function verifyJazzcashSignature(signature: string, payload: string | Buffer, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(typeof payload === 'string' ? payload : payload.toString());
    const calculatedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    logger.error('JazzCash webhook signature verification failed', error as Error);
    return false;
  }
}

/**
 * Verify EasyPaisa webhook signature
 * Uses HMAC-SHA512
 */
function verifyEasyPaisaSignature(signature: string, payload: string | Buffer, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(typeof payload === 'string' ? payload : payload.toString());
    const calculatedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    logger.error('EasyPaisa webhook signature verification failed', error as Error);
    return false;
  }
}

/**
 * Get webhook signature from headers
 */
export async function getWebhookSignature(provider: string): Promise<string | null> {
  try {
    const headersList = await headers();

    switch (provider) {
      case 'stripe':
        return headersList.get('stripe-signature');
      case 'jazzcash':
        return headersList.get('x-jazzcash-signature');
      case 'easypaisa':
        return headersList.get('x-easypaisa-signature');
      default:
        return null;
    }
  } catch (error) {
    logger.error('Failed to get webhook signature from headers', error as Error, { provider });
    return null;
  }
}

/**
 * Validate webhook request
 */
export async function validateWebhookRequest(
  provider: 'stripe' | 'jazzcash' | 'easypaisa',
  payload: string | Buffer,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  const signature = await getWebhookSignature(provider);

  if (!signature) {
    return {
      valid: false,
      error: 'Missing signature header',
    };
  }

  const isValid = verifyWebhookSignature({
    provider,
    signature,
    payload,
    secret,
  });

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid signature',
    };
  }

  return { valid: true };
}

/**
 * Handle Stripe webhook
 */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  try {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature({
      provider: 'stripe',
      signature,
      payload: body,
      secret: stripeSecret,
    });

    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and process the webhook event (see src/app/api/webhooks/stripe/route.ts for implementation)
    logger.info('Stripe webhook verified and received', { signature: signature.slice(0, 20) });

    return Response.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook', error as Error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle JazzCash callback
 */
export async function handleJazzCashCallback(
  params: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const jazzcashSecret = process.env.JAZZCASH_INTEGRITY_SALT;
    if (!jazzcashSecret) {
      return { success: false, error: 'JazzCash secret not configured' };
    }

    // Verify callback signature
    const signature = params.pp_Signature;
    const payload = JSON.stringify(params);

    const isValid = verifyWebhookSignature({
      provider: 'jazzcash',
      signature,
      payload,
      secret: jazzcashSecret,
    });

    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    // Processing is handled in src/app/api/webhooks/jazzcash/return/route.ts
    // which updates orders, tickets, payment_intents, and webhook_logs tables
    logger.info('JazzCash callback verified', { transactionId: params.pp_TxnRefNo });

    return { success: true };
  } catch (error) {
    logger.error('Error processing JazzCash callback', error as Error);
    return { success: false, error: 'Callback processing failed' };
  }
}

/**
 * Handle Easypaisa callback
 */
export async function handleEasypaisaCallback(
  params: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const easypaisaSecret = process.env.EASYPAISA_SECRET_KEY;
    if (!easypaisaSecret) {
      return { success: false, error: 'Easypaisa secret not configured' };
    }

    // Verify callback signature
    const signature = params.signature || params.authToken;
    const payload = JSON.stringify(params);

    const isValid = verifyWebhookSignature({
      provider: 'easypaisa',
      signature,
      payload,
      secret: easypaisaSecret,
    });

    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    // Processing is handled in src/app/api/webhooks/easypaisa/return/route.ts
    // which updates orders, tickets, payment_intents, and webhook_logs tables
    logger.info('Easypaisa callback verified', { transactionId: params.TRANSACTION_ID });

    return { success: true };
  } catch (error) {
    logger.error('Error processing Easypaisa callback', error as Error);
    return { success: false, error: 'Callback processing failed' };
  }
}

/**
 * Idempotency helpers for webhook processing
 * Prevents duplicate order updates if the same webhook is processed twice
 */
export interface WebhookIdempotencyKey {
  provider: string;
  event_id: string;
  created_at?: string;
}

/**
 * Check if a webhook has already been processed
 * Uses webhook_logs table to detect duplicates
 */
export async function isWebhookProcessed(
  provider: string,
  eventId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('provider', provider)
      .eq('event_id', eventId)
      .eq('processed', true)
      .limit(1);

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error checking webhook idempotency', error as Error, { provider, eventId });
    return false;
  }
}

/**
 * Log a webhook event for audit trail and idempotency
 */
export async function logWebhookEvent(
  supabase: any,
  provider: string,
  eventType: string,
  eventId: string,
  payload: Record<string, any>,
  verified: boolean,
  processed: boolean = false
): Promise<void> {
  try {
    await supabase.from('webhook_logs').insert({
      provider,
      event_type: eventType,
      event_id: eventId,
      payload,
      verified,
      processed,
      processed_at: processed ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error logging webhook event', error as Error, {
      provider,
      eventType,
      eventId,
    });
  }
}
