#!/usr/bin/env bash
# ============================================================================
# PHASE 8 — TEST INFRASTRUCTURE HARDENING
# Audit: "Env validation absent" · "Logger noise" · "Polyfills fragile" · "Supabase mock incomplete"
# Run from:  cd /path/to/fstivo && bash PHASE_8_TEST_INFRASTRUCTURE.sh
# ============================================================================
set -euo pipefail

R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' C='\033[0;36m' N='\033[0m'
mkdir -p src/lib/config src/__mocks__/@supabase tests/helpers

step()  { echo -e "${B}▶ $*${N}"; }
ok()    { echo -e "  ${G}✔ $*${N}"; }
warn()  { echo -e "  ${Y}⚠ $*${N}"; }

[[ ! -f package.json ]] && echo -e "${R}✘ Run from project root${N}" && exit 1

echo -e "\n${C}═══════════════════════════════════════════════════${N}"
echo -e "${C}   PHASE 8 — TEST INFRASTRUCTURE HARDENING         ${N}"
echo -e "${C}═══════════════════════════════════════════════════${N}\n"

# ============================================================================
# 8A — Startup env validation (crash early with clear errors)
# ============================================================================
step "8A · Creating startup env validator"

cat > src/lib/config/validate-env.ts << 'TSEOF'
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
TSEOF

ok "Created src/lib/config/validate-env.ts"

# ============================================================================
# 8B — Test-mode logger suppression
# ============================================================================
step "8B · Updating logger for test-mode silence"

TARGET="src/lib/utils/logger.ts"

if [[ -f "$TARGET" ]]; then
  # If logger exists, patch it; otherwise create a new one
  cp "$TARGET" "${TARGET}.bak"

  # Insert a test-mode check at the top
  if ! grep -q "NODE_ENV === 'test'" "$TARGET"; then
    sed -i '1i const IS_TEST = process.env.NODE_ENV === '"'"'test'"'"';' "$TARGET"
    sed -i 's/console\.log/IS_TEST ? () => {} : console.log/g' "$TARGET"
    sed -i 's/console\.warn/IS_TEST ? () => {} : console.warn/g' "$TARGET"
    sed -i 's/console\.error/IS_TEST ? () => {} : console.error/g' "$TARGET"
    ok "Patched existing logger to suppress output in test mode"
  else
    ok "Logger already has test-mode suppression"
  fi
else
  # Create a new logger from scratch
  cat > "$TARGET" << 'LOGEOF'
/* eslint-disable no-console */
const IS_TEST = process.env.NODE_ENV === 'test';
const IS_PROD = process.env.NODE_ENV === 'production';

export const logger = {
  info:  (...args: unknown[]) => { if (!IS_TEST && !IS_PROD) console.log('[FSTIVO info]', ...args); },
  warn:  (...args: unknown[]) => { if (!IS_TEST) console.warn('[FSTIVO warn]', ...args); },
  error: (...args: unknown[]) => { if (!IS_TEST) console.error('[FSTIVO error]', ...args); },
  debug: (...args: unknown[]) => { if (!IS_TEST && !IS_PROD) console.log('[FSTIVO debug]', ...args); },
};
LOGEOF
  ok "Created logger with test-mode suppression"
fi

# ============================================================================
# 8C — Centralize polyfills in jest.setup.ts
# ============================================================================
step "8C · Centralizing polyfills in jest.setup.ts"

TARGET="jest.setup.ts"

cat > "$TARGET" << 'JESTEOF'
/**
 * Jest Global Setup
 * ─────────────────
 * Audit: "Tests needed polyfills for TextEncoder/TextDecoder, Request/Response,
 * and revalidatePath stubbing."
 *
 * This file centralizes all test polyfills so individual test files don't
 * need to repeat them.
 */

import { TextEncoder, TextDecoder } from 'util';

/* ── Polyfills ─────────────────────────────────────────────────────────── */

// TextEncoder/TextDecoder (needed for crypto, Supabase)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Request/Response (needed for Next.js route handlers)
if (typeof global.Request === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.Request  = nodeFetch.Request  as any;
  global.Response = nodeFetch.Response as any;
  global.Headers  = nodeFetch.Headers  as any;
}

/* ── Next.js cache/revalidate stubs ────────────────────────────────────── */

// Mock Next.js cache functions (they throw in test env otherwise)
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag:  jest.fn(),
  unstable_cache:  (fn: any) => fn,  // pass-through
}));

/* ── Suppress expected warnings ────────────────────────────────────────── */

// Suppress "Missing payment config" logs that are expected in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('payment config') || msg.includes('JAZZCASH') || msg.includes('EASYPAISA')) {
    return; // suppress
  }
  originalWarn(...args);
};

/* ── Environment variables for tests ───────────────────────────────────── */

process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.CSRF_SECRET = 'a'.repeat(32);
process.env.ENCRYPTION_KEY = 'b'.repeat(32);
process.env.HASH_SALT = 'c'.repeat(16);
JESTEOF

ok "Created jest.setup.ts with polyfills + stubs"

# Update jest.config if needed to reference it
if [[ -f jest.config.js ]] && ! grep -q "jest.setup.ts" jest.config.js; then
  sed -i "/setupFilesAfterEnv:/a\    '<rootDir>/jest.setup.ts'," jest.config.js
  ok "Added jest.setup.ts to jest.config.js"
fi

# ============================================================================
# 8D — Complete the Supabase mock factory
# ============================================================================
step "8D · Completing Supabase mock factory"

TARGET="src/__mocks__/@supabase/supabase-js.ts"
mkdir -p "$(dirname "$TARGET")"

cat > "$TARGET" << 'MOCKEOF'
/**
 * Supabase Mock Factory
 * ─────────────────────
 * Audit: "Incomplete Supabase client typing/mocks — makes testing risky."
 *
 * This is a comprehensive mock that covers:
 *   • from() → select/insert/update/delete chains
 *   • auth.getUser() / signInWithPassword / signUp
 *   • channel() → on() → subscribe() (realtime)
 *   • storage.from() → upload/download
 *   • rpc() calls
 *
 * Usage in tests:
 *
 *   import { createClient } from '@supabase/supabase-js';
 *   import { mockSupabaseQuery } from '@/__mocks__/@supabase/supabase-js';
 *
 *   const supabase = createClient('url', 'key');
 *   mockSupabaseQuery(supabase, 'events', [{ id: '1', title: 'Test Event' }]);
 *
 *   const { data } = await supabase.from('events').select('*');
 *   expect(data).toEqual([{ id: '1', title: 'Test Event' }]);
 */

interface MockData {
  data?: any;
  error?: any;
  count?: number;
}

const mockDatabase: Record<string, any[]> = {};

/* ── Query builder mock ────────────────────────────────────────────────── */
class MockQueryBuilder {
  private table: string;
  private response: MockData = { data: null, error: null };

  constructor(table: string) {
    this.table = table;
    this.response.data = mockDatabase[table] ?? [];
  }

  select(cols?: string) {
    return this;
  }

  insert(rows: any | any[]) {
    const arr = Array.isArray(rows) ? rows : [rows];
    mockDatabase[this.table] = [...(mockDatabase[this.table] ?? []), ...arr];
    this.response.data = arr;
    return this;
  }

  update(vals: any) {
    // naive: update all rows
    mockDatabase[this.table] = (mockDatabase[this.table] ?? []).map(row => ({ ...row, ...vals }));
    this.response.data = mockDatabase[this.table];
    return this;
  }

  delete() {
    mockDatabase[this.table] = [];
    this.response.data = [];
    return this;
  }

  eq(col: string, val: any) {
    this.response.data = (mockDatabase[this.table] ?? []).filter((r: any) => r[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this.response.data = (mockDatabase[this.table] ?? []).filter((r: any) => r[col] !== val);
    return this;
  }

  in(col: string, vals: any[]) {
    this.response.data = (mockDatabase[this.table] ?? []).filter((r: any) => vals.includes(r[col]));
    return this;
  }

  single() {
    this.response.data = this.response.data?.[0] ?? null;
    return this;
  }

  maybeSingle() {
    this.response.data = this.response.data?.[0] ?? null;
    return this;
  }

  order(col: string, opts?: any) {
    // naive sort
    if (this.response.data) {
      this.response.data.sort((a: any, b: any) => {
        const asc = opts?.ascending !== false;
        return asc ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1);
      });
    }
    return this;
  }

  limit(n: number) {
    if (this.response.data) {
      this.response.data = this.response.data.slice(0, n);
    }
    return this;
  }

  range(from: number, to: number) {
    if (this.response.data) {
      this.response.data = this.response.data.slice(from, to + 1);
    }
    return this;
  }

  // terminal: returns the promise
  then(resolve: any, reject: any) {
    return Promise.resolve(this.response).then(resolve, reject);
  }
}

/* ── Auth mock ─────────────────────────────────────────────────────────── */
const mockAuthResponse = {
  data: { user: { id: 'test-user-id', email: 'test@example.com' } },
  error: null,
};

const mockAuth = {
  getUser: jest.fn(() => Promise.resolve(mockAuthResponse)),
  signInWithPassword: jest.fn(() => Promise.resolve(mockAuthResponse)),
  signUp: jest.fn(() => Promise.resolve(mockAuthResponse)),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
};

/* ── Realtime mock ─────────────────────────────────────────────────────── */
const mockChannel = {
  on: jest.fn(() => mockChannel),
  subscribe: jest.fn(() => mockChannel),
  unsubscribe: jest.fn(() => Promise.resolve()),
};

const mockRealtime = {
  channel: jest.fn(() => mockChannel),
};

/* ── Storage mock ──────────────────────────────────────────────────────── */
const mockStorage = {
  from: jest.fn(() => ({
    upload: jest.fn(() => Promise.resolve({ data: { path: 'test.jpg' }, error: null })),
    download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
    remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.jpg' } })),
  })),
};

/* ── RPC mock ──────────────────────────────────────────────────────────── */
const mockRpc = jest.fn(() => Promise.resolve({ data: null, error: null }));

/* ── Main client ───────────────────────────────────────────────────────── */
export const createClient = jest.fn(() => ({
  from: (table: string) => new MockQueryBuilder(table),
  auth: mockAuth,
  channel: mockRealtime.channel,
  storage: mockStorage,
  rpc: mockRpc,
}));

/* ── Helper for tests ──────────────────────────────────────────────────── */
export function mockSupabaseQuery(client: any, table: string, data: any[]) {
  mockDatabase[table] = data;
}

export function resetMockDatabase() {
  Object.keys(mockDatabase).forEach(k => delete mockDatabase[k]);
}

export { mockAuth, mockChannel, mockStorage, mockRpc };
MOCKEOF

ok "Created src/__mocks__/@supabase/supabase-js.ts"

# Also write a usage example
cat > tests/helpers/supabase-mock-example.test.ts << 'EXEOF'
/**
 * Example: Using the Supabase mock
 */
import { createClient } from '@supabase/supabase-js';
import { mockSupabaseQuery, resetMockDatabase } from '@/__mocks__/@supabase/supabase-js';

describe('Supabase mock example', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it('should mock a select query', async () => {
    const supabase = createClient('url', 'key');
    mockSupabaseQuery(supabase, 'events', [
      { id: '1', title: 'Event 1' },
      { id: '2', title: 'Event 2' },
    ]);

    const { data } = await supabase.from('events').select('*');
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe('Event 1');
  });

  it('should filter with .eq()', async () => {
    const supabase = createClient('url', 'key');
    mockSupabaseQuery(supabase, 'events', [
      { id: '1', status: 'published' },
      { id: '2', status: 'draft' },
    ]);

    const { data } = await supabase.from('events').select('*').eq('status', 'published');
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('1');
  });

  it('should insert rows', async () => {
    const supabase = createClient('url', 'key');
    const { data } = await supabase.from('events').insert({ id: '3', title: 'New Event' }).select();

    expect(data[0].id).toBe('3');
  });
});
EXEOF

ok "Created tests/helpers/supabase-mock-example.test.ts"

# ── summary ──
echo ""
echo -e "${G}═══════════════════════════════════════════════════${N}"
echo -e "${G}   PHASE 8 COMPLETE                                 ${N}"
echo -e "${G}═══════════════════════════════════════════════════${N}"
echo -e "  ${G}✔${N} validate-env.ts       — crashes on missing vars, skip in test mode"
echo -e "  ${G}✔${N} logger.ts updated     — silent in test mode"
echo -e "  ${G}✔${N} jest.setup.ts         — polyfills + Next.js stubs + env defaults"
echo -e "  ${G}✔${N} Supabase mock         — complete factory with helper functions"
echo -e "  ${G}✔${N} Example test          — shows how to use the mock"
echo -e "  ${Y}▸${N} Add to src/app/layout.tsx:  import { validateEnv } from '@/lib/config/validate-env'; validateEnv();"
echo -e "  ${Y}▸${N} Next: run  bash PHASE_9_COVERAGE_TESTS.sh"
echo ""
