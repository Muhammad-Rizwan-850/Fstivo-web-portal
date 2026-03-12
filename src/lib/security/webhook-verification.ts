// =====================================================
// FSTIVO SECURITY - WEBHOOK VERIFICATION
// =====================================================
// Verification for all payment gateway webhooks
// Prevents payment tampering and fraud
// =====================================================

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { verifyJazzCashCallback, verifyEasypaisaCallback, secureCompare } from './crypto';
import { logger } from '@/lib/logger';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  timeout: 10000,
  maxNetworkRetries: 2,
});

// =====================================================
// WEBHOOK VERIFICATION FUNCTIONS
// =====================================================

/**
 * Verify Stripe webhook signature
 * Uses Stripe's signature verification mechanism
 */
export async function verifyStripeWebhook(
  request: NextRequest
): Promise<{ success: boolean; event?: Stripe.Event; error?: string }> {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Check if webhook secret is configured
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return {
      success: false,
      error: 'Webhook configuration missing',
    };
  }

  if (!signature) {
    return {
      success: false,
      error: 'Signature missing',
    };
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    return { success: true, event };
  } catch (error) {
    logger.error('Stripe webhook verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid signature',
    };
  }
}

/**
 * Verify JazzCash callback signature
 */
export async function verifyJazzCashWebhook(
  callbackData: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const integrityKey = process.env.JAZZCASH_INTEGRITY_SALT;

  if (!integrityKey) {
    logger.error('JAZZCASH_INTEGRITY_SALT not configured');
    return {
      success: false,
      error: 'JazzCash configuration missing',
    };
  }

  // Verify required fields
  const requiredFields = ['pp_SecureHash', 'pp_Amount', 'pp_BillReference', 'pp_TxnDateTime', 'pp_MerchantID'];
  for (const field of requiredFields) {
    if (!callbackData[field]) {
      return {
        success: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  const isValid = verifyJazzCashCallback(callbackData, integrityKey);

  if (!isValid) {
    logger.warn('JazzCash webhook signature verification failed');
    return {
      success: false,
      error: 'Invalid signature',
    };
  }

  return { success: true };
}

/**
 * Verify Easypaisa callback signature
 */
export async function verifyEasypaisaWebhook(
  callbackData: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const hashKey = process.env.EASYPAISA_HASH_KEY;

  if (!hashKey) {
    logger.error('EASYPAISA_HASH_KEY not configured');
    return {
      success: false,
      error: 'Easypaisa configuration missing',
    };
  }

  // Verify required fields
  const requiredFields = ['hash', 'amount', 'orderId'];
  for (const field of requiredFields) {
    if (!callbackData[field]) {
      return {
        success: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  const isValid = verifyEasypaisaCallback(callbackData, hashKey);

  if (!isValid) {
    logger.warn('Easypaisa webhook signature verification failed');
    return {
      success: false,
      error: 'Invalid signature',
    };
  }

  return { success: true };
}

// =====================================================
// PAYMENT AMOUNT VALIDATION
// =====================================================

/**
 * Validate payment amount matches expected amount
 * Prevents payment amount tampering
 */
export function validatePaymentAmount(
  requestedAmount: number,
  actualAmount: number,
  tolerance: number = 0.01 // 1% tolerance for rounding
): { valid: boolean; message?: string } {
  // Validate requested amount
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return { valid: false, message: 'Requested amount must be a positive number' };
  }

  if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
    return { valid: false, message: 'Payment amount must be a positive number' };
  }

  // Check min/max bounds
  const minAmount = parseFloat(process.env.MIN_PAYMENT_AMOUNT || '1');
  const maxAmount = parseFloat(process.env.MAX_PAYMENT_AMOUNT || '1000000');

  if (requestedAmount < minAmount) {
    return {
      valid: false,
      message: `Amount below minimum (${minAmount})`,
    };
  }

  if (requestedAmount > maxAmount) {
    return {
      valid: false,
      message: `Amount exceeds maximum (${maxAmount})`,
    };
  }

  // Calculate difference percentage
  const difference = Math.abs(requestedAmount - actualAmount);
  const percentDiff = difference / requestedAmount;

  if (percentDiff > tolerance) {
    return {
      valid: false,
      message: `Amount mismatch: expected ${requestedAmount}, got ${actualAmount} (${(percentDiff * 100).toFixed(2)}% difference)`,
    };
  }

  return { valid: true };
}

// =====================================================
// WEBHOOK EVENT TYPE VALIDATION
// =====================================================

/**
 * Validate Stripe webhook event types
 */
export function isValidStripeEvent(event: Stripe.Event): boolean {
  const validEvents = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.requires_action',
    'charge.refunded',
    'charge.refund.updated',
    'checkout.session.completed',
    'checkout.session.expired',
  ];

  return validEvents.includes(event.type);
}

/**
 * Validate JazzCash response codes
 */
export function isValidJazzCashResponse(callbackData: Record<string, string>): boolean {
  const validResponseCodes = ['000', '121', '200', '400', '401', '404', '500'];
  const responseCode = callbackData.pp_ResponseCode;

  return responseCode ? validResponseCodes.includes(responseCode) : false;
}

/**
 * Validate Easypaisa response
 */
export function isValidEasypaisaResponse(callbackData: Record<string, string>): boolean {
  const validStatuses = ['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED'];
  const status = callbackData.status;

  return status ? validStatuses.includes(status.toUpperCase()) : false;
}

// =====================================================
// WEBHOOK DUPLICATE CHECK
// =====================================================

/**
 * Check for duplicate webhook deliveries
 * Uses idempotency keys
 */
export async function isDuplicateWebhook(
  eventId: string,
  webhookType: 'stripe' | 'jazzcash' | 'easypaisa'
): Promise<boolean> {
  // In production, check database or cache
  // This is a placeholder implementation

  const redis = require('../cache/redis-config').redis;
  const key = `webhook:${webhookType}:${eventId}`;

  const exists = await redis.exists(key);

  if (exists) {
    return true;
  }

  // Store for 24 hours
  await redis.setex(key, 86400, '1');

  return false;
}

// =====================================================
// WEBHOOK RESPONSE BUILDER
// =====================================================

/**
 * Build success response for webhook
 */
export function webhookSuccess(message: string = 'Webhook processed successfully') {
  return Response.json(
    {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

/**
 * Build error response for webhook
 */
export function webhookError(message: string, statusCode: number = 400) {
  return Response.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// =====================================================
// WEBHOOK LOGGING
// =====================================================

interface WebhookLog {
  id: string;
  provider: 'stripe' | 'jazzcash' | 'easypaisa';
  eventId: string;
  eventType: string;
  verified: boolean;
  processed: boolean;
  errorMessage?: string;
  receivedAt: Date;
  processedAt?: Date;
}

/**
 * Log webhook delivery
 */
export async function logWebhook(
  provider: 'stripe' | 'jazzcash' | 'easypaisa',
  eventId: string,
  eventType: string,
  verified: boolean,
  processed: boolean,
  errorMessage?: string
): Promise<void> {
  // In production, store in database
  // This is a placeholder implementation

  const log: WebhookLog = {
    id: generateWebhookLogId(),
    provider,
    eventId,
    eventType,
    verified,
    processed,
    errorMessage,
    receivedAt: new Date(),
    processedAt: processed ? new Date() : undefined,
  };

  logger.info('[Webhook Log]', JSON.stringify(log));

  // TODO: Store in webhook_logs table
}

/**
 * Generate webhook log ID
 */
function generateWebhookLogId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================================
// WEBHOOK RETRY HANDLER
// =====================================================

/**
 * Handle webhook retry logic
 */
export function shouldRetryWebhook(
  attemptNumber: number,
  error: Error
): { shouldRetry: boolean; retryAfter?: number } {
  const MAX_RETRIES = 3;

  if (attemptNumber >= MAX_RETRIES) {
    return { shouldRetry: false };
  }

  // Don't retry on validation errors
  if (error.message.includes('Invalid signature')) {
    return { shouldRetry: false };
  }

  if (error.message.includes('Missing required field')) {
    return { shouldRetry: false };
  }

  // Exponential backoff
  const retryAfter = Math.min(1000 * Math.pow(2, attemptNumber), 10000);

  return { shouldRetry: true, retryAfter };
}

// =====================================================
// WEBHOOK SECURITY HEADERS
// =====================================================

/**
 * Validate webhook request headers
 */
export function validateWebhookHeaders(
  request: NextRequest,
  provider: 'stripe' | 'jazzcash' | 'easypaisa'
): { valid: boolean; error?: string } {
  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json') && !contentType?.includes('application/x-www-form-urlencoded')) {
    return {
      valid: false,
      error: 'Invalid content type',
    };
  }

  // Check user agent (optional but recommended)
  const userAgent = request.headers.get('user-agent');
  if (!userAgent) {
    return {
      valid: false,
      error: 'User agent missing',
    };
  }

  // Provider-specific checks
  switch (provider) {
    case 'stripe':
      const stripeSignature = request.headers.get('stripe-signature');
      if (!stripeSignature) {
        return {
          valid: false,
          error: 'Stripe signature missing',
        };
      }
      break;

    case 'jazzcash':
    case 'easypaisa':
      // These providers may not have specific headers
      break;
  }

  return { valid: true };
}
