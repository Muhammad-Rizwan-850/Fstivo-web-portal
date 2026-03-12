import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Node test environment
if (typeof (global as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  (global as any).TextEncoder = util.TextEncoder;
  (global as any).TextDecoder = util.TextDecoder;
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Polyfill for Web Request API in Node.js 18+
if (typeof global.Request === 'undefined') {
  // @ts-ignore - Add Request to global scope
  global.Request = class Request {
    _url: string;

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      // Use Object.defineProperty for url to make it read-only (compatible with Next.js NextRequest)
      this._url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any).url;
      Object.defineProperty(this, 'url', {
        get: () => this._url,
        set: (value) => { this._url = value; },
        enumerable: true,
        configurable: true,
      });
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body ?? null; // Convert undefined to null
      // @ts-ignore
      this.cache = init?.cache || 'default';
      // @ts-ignore
      this.credentials = init?.credentials || 'same-origin';
      // @ts-ignore
      this.mode = init?.mode || 'cors';
      // @ts-ignore
      this.redirect = init?.redirect || 'follow';
      // @ts-ignore
      this.referrer = init?.referrer || 'about:client';
      // @ts-ignore
      this.referrerPolicy = init?.referrerPolicy || '';
      // @ts-ignore
      this.integrity = init?.integrity || '';
      // @ts-ignore
      this.keepalive = init?.keepalive || false;
      // @ts-ignore
      this.signal = init?.signal;
    }
    method: string;
    headers: Headers;
    body: BodyInit | null;
    cache: RequestCache;
    credentials: RequestCredentials;
    mode: RequestMode;
    redirect: RequestRedirect;
    referrer: string;
    referrerPolicy: ReferrerPolicy;
    integrity: string;
    keepalive: boolean;
    signal: AbortSignal | null;

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return {};
    }

    async text() {
      return typeof this.body === 'string' ? this.body : '';
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
  } as unknown as typeof Request;
}

if (typeof global.Response === 'undefined') {
  // @ts-ignore - Add Response to global scope
  global.Response = class Response {
    static json(body: any, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
        },
      });
    }

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
      this.body = body ?? null;
      // @ts-ignore
      this.url = init?.url || '';
      // @ts-ignore
      this.ok = this.status >= 200 && this.status < 300;
      // @ts-ignore
      this.redirected = init?.redirected || false;
      // @ts-ignore
      this.type = init?.type || 'basic';
    }

    status: number;
    statusText: string;
    headers: Headers;
    body: BodyInit | null;
    url: string;
    ok: boolean;
    redirected: boolean;
    type: ResponseType;

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return {};
    }

    async text() {
      return typeof this.body === 'string' ? this.body : '';
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
  } as unknown as typeof Response;
}

if (typeof global.Headers === 'undefined') {
  // @ts-ignore - Add Headers to global scope
  global.Headers = class Headers {
    constructor(init?: HeadersInit) {
      this._headers = new Map<string, string>();

      if (init) {
        if (init instanceof Headers) {
          init._headers.forEach((value: string, key: string) => {
            this._headers.set(key, value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers.set(key, value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this._headers.set(key, value as string);
          });
        }
      }
    }

    _headers: Map<string, string>;

    append(name: string, value: string) {
      const existing = this._headers.get(name) || '';
      this._headers.set(name, existing + ', ' + value);
    }

    delete(name: string) {
      this._headers.delete(name);
    }

    get(name: string) {
      return this._headers.get(name) || null;
    }

    has(name: string) {
      return this._headers.has(name);
    }

    set(name: string, value: string) {
      this._headers.set(name, value);
    }

    forEach(callback: (value: string, key: string, parent: Headers) => void) {
      this._headers.forEach((value, key) => {
        callback(value, key, this as unknown as Headers);
      });
    }

    *entries() {
      for (const [key, value] of this._headers.entries()) {
        yield [key, value];
      }
    }

    *keys() {
      for (const key of this._headers.keys()) {
        yield key;
      }
    }

    *values() {
      for (const value of this._headers.values()) {
        yield value;
      }
    }
  } as unknown as typeof Headers;
}

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// =====================================================
// SUPABASE MOCKS - Added for HIGH PRIORITY FIXES
// =====================================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Create a chainable Supabase query builder mock
const createChainableMock = () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => Promise.resolve(resolve ? resolve({ data: [], error: null }) : { data: [], error: null })),
  };
  return mockChain;
};

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => createChainableMock()),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
  })),
}));

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => createChainableMock()),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

// Mock Supabase SSR client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => createChainableMock()),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));
