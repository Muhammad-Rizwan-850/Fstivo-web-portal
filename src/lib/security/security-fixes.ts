// =====================================================
// FSTIVO SECURITY FIXES - CRITICAL ISSUES
// =====================================================
// This file contains fixes for all 10 critical security issues
// =====================================================

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// =====================================================
// FIX #1: JazzCash Cryptographic Hash Implementation
// Location: src/lib/payments/jazzcash.ts
// =====================================================

export function generateJazzCashHash(
  merchantId: string,
  password: string,
  amount: string,
  billReference: string,
  txnDateTime: string,
  integrityKey: string
): string {
  // Create HMAC SHA256 hash instead of base64
  const dataString = `${integrityKey}&${amount}&${billReference}&${txnDateTime}&${merchantId}&${password}`;

  const hash = crypto
    .createHmac('sha256', integrityKey)
    .update(dataString)
    .digest('hex')
    .toUpperCase();

  return hash;
}

export function verifyJazzCashCallback(
  callbackData: Record<string, string>,
  integrityKey: string
): boolean {
  const receivedHash = callbackData.pp_SecureHash;

  // Reconstruct data string from callback
  const sortedKeys = Object.keys(callbackData)
    .filter(key => key !== 'pp_SecureHash')
    .sort();

  const dataString = sortedKeys
    .map(key => callbackData[key])
    .join('&');

  const expectedHash = crypto
    .createHmac('sha256', integrityKey)
    .update(`${integrityKey}&${dataString}`)
    .digest('hex')
    .toUpperCase();

  return receivedHash === expectedHash;
}

// =====================================================
// FIX #2 & #3: Payment Webhook Verification & Amount Validation
// Location: src/lib/payments/webhook.ts
// =====================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, // Updated Stripe API version
});

// Stripe webhook verification
export async function verifyStripeWebhook(
  request: NextRequest
): Promise<Stripe.Event | null> {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return null;
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    logger.error('Stripe webhook verification failed:', error);
    return null;
  }
}

// JazzCash webhook verification
export async function verifyJazzCashWebhook(
  callbackData: Record<string, string>
): Promise<boolean> {
  const integrityKey = process.env.JAZZCASH_INTEGRITY_SALT;

  if (!integrityKey) {
    throw new Error('JazzCash integrity key not configured');
  }

  return verifyJazzCashCallback(callbackData, integrityKey);
}

// Easypaisa webhook verification
export async function verifyEasypaisaWebhook(
  callbackData: Record<string, string>
): Promise<boolean> {
  const hashKey = process.env.EASYPAISA_HASH_KEY;

  if (!hashKey) {
    throw new Error('Easypaisa hash key not configured');
  }

  const receivedHash = callbackData.hash; // Adjust based on actual field
  const expectedHash = crypto
    .createHmac('sha256', hashKey)
    .update(JSON.stringify(callbackData))
    .digest('hex');

  return receivedHash === expectedHash;
}

// Payment amount validation
export function validatePaymentAmount(
  requestedAmount: number,
  actualAmount: number,
  tolerance: number = 0.01 // 1% tolerance for rounding
): { valid: boolean; message?: string } {
  if (requestedAmount <= 0) {
    return { valid: false, message: 'Amount must be positive' };
  }

  if (actualAmount <= 0) {
    return { valid: false, message: 'Payment amount must be positive' };
  }

  const difference = Math.abs(requestedAmount - actualAmount);
  const percentDiff = difference / requestedAmount;

  if (percentDiff > tolerance) {
    return {
      valid: false,
      message: `Amount mismatch: expected ${requestedAmount}, got ${actualAmount}`,
    };
  }

  return { valid: true };
}

// =====================================================
// FIX #4: SQL Injection Prevention
// Location: src/lib/database/queries/safe-search.ts
// =====================================================

import { createClient as createAuthClient } from '@/lib/auth/config';

export async function safeSearchAttendees(
  eventId: string,
  searchQuery: string,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = await createAuthClient();

  // Sanitize search query - remove special characters
  const sanitizedQuery = searchQuery
    .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
    .trim();

  if (sanitizedQuery.length === 0) {
    return { data: [], total: 0 };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Use parameterized queries (Supabase does this automatically)
  const { data, count, error } = await supabase
    .from('attendees')
    .select('*, registrations!inner(*)', { count: 'exact' })
    .eq('registrations.event_id', eventId)
    .or(`full_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return { data: data || [], total: count || 0 };
}

// =====================================================
// FIX #5: Auth Bypass Prevention
// Location: src/lib/auth/config.ts
// =====================================================

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Critical: Fail fast if Supabase not configured
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing - authentication unavailable');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component - can't set cookies
        }
      },
    },
  });
}

// =====================================================
// FIX #6: Rate Limiting Implementation
// Location: src/lib/middleware/rate-limit.ts
// =====================================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }

    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(record.resetTime),
          },
        }
      );
    }

    // Increment count
    record.count++;
    return null; // Allow request
  };
}

// Usage in API routes
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5, // Stricter for auth endpoints
});

export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 payment requests per minute
});

// =====================================================
// FIX #7: Environment Variable Protection
// Location: src/lib/config/env-validator.ts
// =====================================================

// Define schema for environment variables
const envSchema = z.object({
  // Public variables (safe to expose)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // Server-only variables (MUST NOT be exposed)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  RESEND_API_KEY: z.string().startsWith('re_'),

  // Optional variables
  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().optional(),
  EASYPAISA_STORE_ID: z.string().optional(),
  EASYPAISA_HASH_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validate and export typed environment variables
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    logger.error('❌ Environment variable validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration');
  }
}

// Validate on app startup
export const env = validateEnv();

// =====================================================
// FIX #8: CSRF Protection
// Location: src/lib/middleware/csrf.ts
// =====================================================

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(
  request: NextRequest
): { valid: boolean; error?: string } {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  const token = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value;

  if (!token) {
    return { valid: false, error: 'CSRF token missing from header' };
  }

  if (!cookieToken) {
    return { valid: false, error: 'CSRF token missing from cookie' };
  }

  if (token !== cookieToken) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}

// Middleware to add CSRF protection
export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const validation = validateCSRFToken(request);

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'CSRF validation failed', details: validation.error },
      { status: 403 }
    );
  }

  return null; // Allow request
}

// =====================================================
// FIX #9: Cron Job Authentication
// Location: src/app/api/cron/event-reminders/route.ts
// =====================================================

export async function verifyCronAuth(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    logger.error('CRON_SECRET not configured');
    return false;
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron job attempt');
    return false;
  }

  return true;
}

// =====================================================
// FIX #10: Admin Authorization Middleware
// Location: src/lib/middleware/admin-auth.ts
// =====================================================

export async function requireAdmin(
  request: NextRequest
): Promise<{ user: any; error?: NextResponse }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (error) {
    logger.error('Admin auth error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

// =====================================================
// SECURITY UTILITIES
// =====================================================

// Secure random string generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Constant-time string comparison (prevents timing attacks)
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 1000); // Limit length
}

// =====================================================
// SECURITY CONFIGURATION OBJECT
// =====================================================

export const securityConfig = {
  rateLimit: {
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    payment: { windowMs: 60 * 1000, maxRequests: 10 },
  },
  csrf: {
    enabled: true,
    cookieName: 'csrf_token',
    headerName: 'x-csrf-token',
  },
  webhooks: {
    stripe: { verifySignature: true },
    jazzcash: { verifyHash: true },
    easypaisa: { verifyHash: true },
  },
  payment: {
    amountValidation: { enabled: true, tolerance: 0.01 },
    minimumAmount: 1, // 1 PKR
    maximumAmount: 1000000, // 1M PKR
  },
};
