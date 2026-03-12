/**
 * Environment Variable Validation
 * Checks for required env vars at startup and provides clear error messages.
 * Prevents silent failures when critical integrations are misconfigured.
 */

import { logger } from './logger';

export interface EnvValidation {
  name: string;
  required: boolean;
  env: string | undefined;
  isValid: boolean;
  errorMessage?: string;
}

const requiredEnvs = {
  // Payment integrations
  JAZZCASH_MERCHANT_ID: { required: true, label: 'JazzCash Merchant ID' },
  JAZZCASH_PASSWORD: { required: true, label: 'JazzCash Password' },
  JAZZCASH_INTEGRITY_SALT: { required: true, label: 'JazzCash Integrity Salt' },

  EASYPAISA_STORE_ID: { required: true, label: 'EasyPaisa Store ID' },
  EASYPAISA_SECRET_KEY: { required: true, label: 'EasyPaisa Secret Key' },

  STRIPE_SECRET_KEY: { required: true, label: 'Stripe Secret Key' },
  STRIPE_WEBHOOK_SECRET: { required: true, label: 'Stripe Webhook Secret' },

  // SMS/Notifications
  TWILIO_ACCOUNT_SID: { required: true, label: 'Twilio Account SID' },
  TWILIO_AUTH_TOKEN: { required: true, label: 'Twilio Auth Token' },
  TWILIO_PHONE_NUMBER: { required: true, label: 'Twilio Phone Number' },

  // Redis/Upstash (for rate limiting)
  UPSTASH_REDIS_REST_URL: { required: false, label: 'Upstash Redis URL' },
  UPSTASH_REDIS_REST_TOKEN: { required: false, label: 'Upstash Redis Token' },

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: { required: true, label: 'Supabase URL' },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true, label: 'Supabase Anon Key' },
  SUPABASE_SERVICE_ROLE_KEY: { required: true, label: 'Supabase Service Role Key' },

  // AI/ML
  OPENAI_API_KEY: { required: false, label: 'OpenAI API Key' },

  // App
  NEXT_PUBLIC_APP_URL: { required: true, label: 'App URL' },
};

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(requiredEnvs).forEach(([key, config]) => {
    const value = process.env[key];

    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key} (${config.label})`);
    }

    // Validate specific formats if needed
    if (value) {
      if (key === 'TWILIO_PHONE_NUMBER' && !value.startsWith('+')) {
        errors.push(`Invalid format: ${key} must start with + (e.g., +12025551234)`);
      }

      if (key === 'NEXT_PUBLIC_APP_URL' && !value.startsWith('http')) {
        errors.push(`Invalid format: ${key} must be a valid URL (e.g., https://example.com)`);
      }

      if (key.endsWith('_URL') && !value.startsWith('http')) {
        if (!key.includes('SUPABASE')) {
          errors.push(`Invalid format: ${key} must be a valid URL`);
        }
      }
    }
  });

  const valid = errors.length === 0;

  if (!valid) {
    logger.error('Environment validation failed:', {
      errors,
      missingCount: errors.length,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  return { valid, errors };
}

export function getEnvStatus(): Record<string, EnvValidation> {
  const status: Record<string, EnvValidation> = {};

  Object.entries(requiredEnvs).forEach(([key, config]) => {
    const env = process.env[key];
    status[key] = {
      name: config.label,
      required: config.required,
      env: env ? '***' : undefined, // Don't expose actual values
      isValid: config.required ? !!env : true,
    };
  });

  return status;
}

/**
 * Check if optional integrations are configured
 */
export function isPaymentIntegrationConfigured(provider: 'jazzcash' | 'easypaisa' | 'stripe'): boolean {
  switch (provider) {
    case 'jazzcash':
      return !!(process.env.JAZZCASH_MERCHANT_ID && process.env.JAZZCASH_PASSWORD && process.env.JAZZCASH_INTEGRITY_SALT);
    case 'easypaisa':
      return !!(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_SECRET_KEY);
    case 'stripe':
      return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    default:
      return false;
  }
}

export function isSMSConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
