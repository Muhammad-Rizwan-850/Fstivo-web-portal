// =====================================================
// FSTIVO SECURITY - ENVIRONMENT VALIDATION
// =====================================================
// Validates all environment variables on startup
// Prevents misconfiguration and secrets exposure
// =====================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';

// =====================================================
// ENVIRONMENT VARIABLE SCHEMA
// =====================================================

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // =====================================================
  // PUBLIC VARIABLES (safe to expose to browser)
  // =====================================================

  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Stripe (public key only)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // VAPID keys for push notifications
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),

  // =====================================================
  // SERVER-ONLY VARIABLES (MUST NOT be exposed)
  // =====================================================

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe (secret keys)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // JazzCash
  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().min(1).optional(),

  // Easypaisa
  EASYPAISA_STORE_ID: z.string().optional(),
  EASYPAISA_SECRET_KEY: z.string().optional(),
  EASYPAISA_HASH_KEY: z.string().optional(),

  // Email service
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC').optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // VAPID private key
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().email().optional(),

  // Cron job security
  CRON_SECRET: z.string().min(32).optional(),

  // AI services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),

  // =====================================================
  // OPTIONAL CONFIGURATION
  // =====================================================

  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Payment limits
  MIN_PAYMENT_AMOUNT: z.string().transform(Number).default('1'),
  MAX_PAYMENT_AMOUNT: z.string().transform(Number).default('1000000'),

  // Rate limiting
  ENABLE_RATE_LIMITING: z.string().transform(v => v === 'true').default('true'),

  // CSRF
  ENABLE_CSRF: z.string().transform(v => v === 'true').default('true'),

  // Notification settings
  DEV_MODE_NOTIFICATIONS: z.string().transform(v => v === 'true').default('false'),
  DEV_LOG_NOTIFICATIONS: z.string().transform(v => v === 'true').default('true'),
});

// =====================================================
// EXPORTED TYPES
// =====================================================

export type Env = z.infer<typeof envSchema>;

// =====================================================
// VALIDATION FUNCTION
// =====================================================

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation checks
    validateNoPublicKeysInServerVars(env);
    validateRequiredKeysPresent(env);

    validatedEnv = env;

    if (process.env.NODE_ENV !== 'test') {
      logger.info('✅ Environment variables validated successfully');
    }

    return env;
  } catch (error) {
    logger.error('❌ Environment variable validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration. Application cannot start.');
  }
}

// =====================================================
// ADDITIONAL VALIDATIONS
// =====================================================

/**
 * Ensure server-only variables are not exposed to client
 */
function validateNoPublicKeysInServerVars(env: Env): void {
  const serverVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'JAZZCASH_PASSWORD',
    'JAZZCASH_INTEGRITY_SALT',
    'EASYPAISA_SECRET_KEY',
    'EASYPAISA_HASH_KEY',
    'TWILIO_AUTH_TOKEN',
    'VAPID_PRIVATE_KEY',
    'CRON_SECRET',
  ];

  const publicVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'));

  for (const serverVar of serverVars) {
    const serverValue = process.env[serverVar];

    if (!serverValue) continue;

    for (const publicVar of publicVars) {
      const publicValue = process.env[publicVar];

      if (publicValue && publicValue === serverValue) {
        throw new Error(
          `Security violation: Server-only variable '${serverVar}' is exposed in public variable '${publicVar}'`
        );
      }
    }
  }
}

/**
 * Ensure required keys are present for enabled features
 */
function validateRequiredKeysPresent(env: Env): void {
  // Check payment gateways
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
  const jazzCashEnabled = !!process.env.JAZZCASH_MERCHANT_ID;
  const easypaisaEnabled = !!process.env.EASYPAISA_STORE_ID;

  if (!stripeEnabled && !jazzCashEnabled && !easypaisaEnabled) {
    logger.warn('⚠️  Warning: No payment gateway configured');
  }

  // Check email service
  if (!process.env.RESEND_API_KEY) {
    logger.warn('⚠️  Warning: Email service not configured');
  }

  // Check database
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing');
  }
}

// =====================================================
// GET VALIDATED ENV (singleton)
// =====================================================

export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }

  return validatedEnv;
}

// =====================================================
// ENVIRONMENT HELPERS
// =====================================================

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

/**
 * Get site URL
 */
export function getSiteURL(): string {
  return getEnv().NEXT_PUBLIC_SITE_URL;
}

/**
 * Get app URL
 */
export function getAppURL(): string {
  return getEnv().NEXT_PUBLIC_APP_URL;
}

/**
 * Check if payment gateway is enabled
 */
export function isPaymentGatewayEnabled(gateway: 'stripe' | 'jazzcash' | 'easypaisa'): boolean {
  const env = getEnv();

  switch (gateway) {
    case 'stripe':
      return !!env.STRIPE_SECRET_KEY && !!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    case 'jazzcash':
      return !!env.JAZZCASH_MERCHANT_ID && !!env.JAZZCASH_PASSWORD;
    case 'easypaisa':
      return !!env.EASYPAISA_STORE_ID && !!env.EASYPAISA_SECRET_KEY;
    default:
      return false;
  }
}

/**
 * Get payment configuration
 */
export function getPaymentConfig() {
  const env = getEnv();

  return {
    stripe: {
      enabled: isPaymentGatewayEnabled('stripe'),
      publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    jazzcash: {
      enabled: isPaymentGatewayEnabled('jazzcash'),
      merchantId: env.JAZZCASH_MERCHANT_ID,
      integritySalt: env.JAZZCASH_INTEGRITY_SALT,
    },
    easypaisa: {
      enabled: isPaymentGatewayEnabled('easypaisa'),
      storeId: env.EASYPAISA_STORE_ID,
      hashKey: env.EASYPAISA_HASH_KEY,
    },
    limits: {
      min: env.MIN_PAYMENT_AMOUNT,
      max: env.MAX_PAYMENT_AMOUNT,
    },
  };
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  const env = getEnv();

  return {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
    enabled: !!env.RESEND_API_KEY,
  };
}

/**
 * Get notification configuration
 */
export function getNotificationConfig() {
  const env = getEnv();

  return {
    devMode: env.DEV_MODE_NOTIFICATIONS,
    devLog: env.DEV_LOG_NOTIFICATIONS,
    twilio: {
      enabled: !!env.TWILIO_ACCOUNT_SID && !!env.TWILIO_AUTH_TOKEN,
      accountSid: env.TWILIO_ACCOUNT_SID,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
    },
    vapid: {
      publicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
      subject: env.VAPID_SUBJECT,
    },
  };
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  const env = getEnv();

  return {
    csrf: {
      enabled: env.ENABLE_CSRF,
    },
    rateLimit: {
      enabled: env.ENABLE_RATE_LIMITING,
    },
    cron: {
      secret: env.CRON_SECRET,
    },
  };
}

// =====================================================
// VALIDATION ON STARTUP
// =====================================================

// Validate environment on module load (unless in test)
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

// =====================================================
// EXPORTS
// =====================================================

export default getEnv;
