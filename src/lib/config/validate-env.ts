/**
 * Startup Environment Validation
 * ───────────────────────────────
 * Audit finding: "Missing or weak validation leads to noisy logs in tests
 * and runtime errors."
 *
 * This module validates all critical env vars on app startup and crashes
 * with a clear error message if any are missing or malformed.
 *
 * Usage:
 *   Import once at the top of src/app/layout.tsx (server component):
 *
 *   import { validateEnv } from '@/lib/config/validate-env';
 *   validateEnv();   // crashes on missing vars BEFORE any requests
 */

interface EnvVar {
  key: string;
  required: boolean;
  validator?: (val: string) => boolean;
  example?: string;
}

const ENV_SPEC: EnvVar[] = [
  // Supabase (required in all envs)
  { key: 'NEXT_PUBLIC_SUPABASE_URL',     required: true,  validator: (v) => v.startsWith('https://'), example: 'https://xxx.supabase.co' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',required: true,  validator: (v) => v.startsWith('eyJ'),      example: 'eyJ…' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',    required: true,  validator: (v) => v.startsWith('eyJ'),      example: 'eyJ…' },

  // Stripe (required in prod)
  { key: 'STRIPE_SECRET_KEY',            required: true,  validator: (v) => v.startsWith('sk_'),      example: 'sk_live_…' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: true, validator: (v) => v.startsWith('pk_'), example: 'pk_live_…' },
  { key: 'STRIPE_WEBHOOK_SECRET',        required: false, validator: (v) => v.startsWith('whsec_'),   example: 'whsec_…' },

  // JazzCash (required in prod if enabled)
  { key: 'JAZZCASH_MERCHANT_ID',         required: false, example: 'MC12345' },
  { key: 'JAZZCASH_PASSWORD',            required: false, example: 'password123' },
  { key: 'JAZZCASH_INTEGRITY_SALT',      required: false, example: 'salt123' },

  // EasyPaisa (required in prod if enabled)
  { key: 'EASYPAISA_STORE_ID',           required: false, example: 'STORE123' },
  { key: 'EASYPAISA_SECRET_KEY',         required: false, example: 'secret123' },

  // Twilio (required for SMS)
  { key: 'TWILIO_ACCOUNT_SID',           required: false, validator: (v) => v.startsWith('AC'),       example: 'AC…' },
  { key: 'TWILIO_AUTH_TOKEN',            required: false, example: 'token123' },
  { key: 'TWILIO_PHONE_NUMBER',          required: false, validator: (v) => v.startsWith('+'),        example: '+1…' },

  // Resend (required for email)
  { key: 'RESEND_API_KEY',               required: false, validator: (v) => v.startsWith('re_'),      example: 're_…' },

  // Redis (optional, falls back to in-memory)
  { key: 'UPSTASH_REDIS_REST_URL',       required: false, validator: (v) => v.startsWith('https://'), example: 'https://…' },
  { key: 'UPSTASH_REDIS_REST_TOKEN',     required: false, example: 'token123' },

  // Security secrets (required in prod)
  { key: 'CSRF_SECRET',                  required: true,  validator: (v) => v.length >= 32,           example: 'openssl rand -hex 32' },
  { key: 'ENCRYPTION_KEY',               required: true,  validator: (v) => v.length >= 32,           example: 'openssl rand -hex 32' },
  { key: 'HASH_SALT',                    required: true,  validator: (v) => v.length >= 16,           example: 'openssl rand -hex 16' },

  // App URL (required)
  { key: 'NEXT_PUBLIC_APP_URL',          required: true,  validator: (v) => v.startsWith('http'),     example: 'https://fstivo.com' },
];

export function validateEnv(): void {
  // Skip validation in test env (jest sets NODE_ENV=test)
  if (process.env.NODE_ENV === 'test') return;

  const errors: string[] = [];

  for (const spec of ENV_SPEC) {
    const val = process.env[spec.key];

    // Required check
    if (spec.required && !val) {
      errors.push(`✘ ${spec.key} is REQUIRED but missing. Example: ${spec.example ?? 'see .env.production.example'}`);
      continue;
    }

    // Validator check
    if (val && spec.validator && !spec.validator(val)) {
      errors.push(`✘ ${spec.key} has invalid format. Example: ${spec.example ?? 'see .env.production.example'}`);
    }
  }

  if (errors.length > 0) {
    console.error('\n╔═══════════════════════════════════════════════════════════════╗');
    console.error('║  STARTUP FAILED — ENVIRONMENT VARIABLES MISSING OR INVALID   ║');
    console.error('╚═══════════════════════════════════════════════════════════════╝\n');
    errors.forEach(err => console.error(err));
    console.error('\nFix: Copy .env.production.example → .env.local and fill in real values.\n');
    process.exit(1);
  }
}
