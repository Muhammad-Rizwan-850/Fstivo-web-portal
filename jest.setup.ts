/**
 * Jest Global Setup
 * Fixed version without readonly property assignment error
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

// Fix NextRequest compatibility - Next.js extends Request with read-only url
// We need to make the polyfill compatible with Next.js's NextRequest class
if (typeof (global as any).NextRequest === 'undefined') {
  const { Request: NodeRequest } = require('node-fetch');

  (global as any).NextRequest = class NextRequest extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      // Call parent constructor
      super(input as string, init);

      // Set url as a getter (read-only) to match Next.js behavior
      const urlValue = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any).url;
      Object.defineProperty(this, 'url', {
        value: urlValue,
        writable: false,
        enumerable: true,
        configurable: false,
      });

      // Add Next.js specific properties
      Object.defineProperty(this, 'nextUrl', {
        value: { pathname: new URL(urlValue).pathname },
        writable: false,
        enumerable: true,
        configurable: false,
      });

      Object.defineProperty(this, 'ip', {
        value: '127.0.0.1',
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  };
}

/* ── Next.js cache/revalidate stubs ────────────────────────────────────── */

// Mock Next.js cache functions (they throw in test env otherwise)
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag:  jest.fn(),
  unstable_cache: (fn: any) => fn,  // pass-through
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

// FIX: Use Object.defineProperty instead of direct assignment to avoid readonly error
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    NODE_ENV: 'test',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    STRIPE_SECRET_KEY: 'sk_test_123',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    CSRF_SECRET: 'a'.repeat(32),
    ENCRYPTION_KEY: 'b'.repeat(32),
    HASH_SALT: 'c'.repeat(16),
  },
  writable: true,
  configurable: true,
});
