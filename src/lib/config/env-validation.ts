// =====================================================
// ENVIRONMENT VARIABLE VALIDATION
// =====================================================
// Validates all required environment variables at startup
// Prevents runtime errors from missing env vars
// =====================================================

import { z } from 'zod';
import { logger } from '@/lib/logger';

// Environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'Stripe publishable key is required').optional(),
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required').optional(),

  // JazzCash
  JAZZCASH_MERCHANT_ID: z.string().min(1, 'JazzCash merchant ID is required').optional(),
  JAZZCASH_PASSWORD: z.string().min(1, 'JazzCash password is required').optional(),
  JAZZCASH_SECRET_KEY: z.string().min(1, 'JazzCash secret key is required').optional(),

  // EasyPaisa
  EASYPAISA_MERCHANT_ID: z.string().min(1, 'EasyPaisa merchant ID is required').optional(),
  EASYPAISA_PASSWORD: z.string().min(1, 'EasyPaisa password is required').optional(),
  EASYPAISA_SECRET_KEY: z.string().min(1, 'EasyPaisa secret key is required').optional(),

  // Resend (Email)
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required').optional(),
  RESEND_FROM_EMAIL: z.string().email('Invalid Resend from email').optional(),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),

  // Upstash (Redis) - Optional
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash token is required').optional(),

  // OpenAI - Optional
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required').optional(),

  // Security
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform((val) => val === 'true').default('false'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters').optional(),
});

type EnvInput = Record<string, any>;

// Validate environment variables
function validateEnv(env: EnvInput) {
  try {
    const validated = envSchema.parse(env);
    return { success: true as const, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return { success: false as const, errors };
    }
    return { success: false as const, errors: [{ path: 'unknown', message: 'Unknown validation error' }] };
  }
}

// Validate current environment
export function validateEnvironment() {
  const result = validateEnv(process.env);

  if (!result.success) {
    logger.error('❌ Invalid environment variables:');
    result.errors.forEach((err) => {
      logger.error(`  - ${err.path}: ${err.message}`);
    });
    throw new Error('Environment validation failed. Please check your .env.local file.');
  }

  // Log success in development
  if (result.data.NODE_ENV === 'development') {
    logger.info('✅ Environment variables validated successfully');
  }

  return result.data;
}

// Export validated environment
export const env = validateEnvironment();

// Type-safe access to environment variables
export default env;
