import { updateSession } from '@/lib/auth/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { csrfMiddleware } from '@/lib/middleware/csrf'
import { compressionMiddleware } from '@/lib/middleware/compression'

// =====================================================
// PERFORMANCE: Import caching layer
// =====================================================
import { checkCache, storeCache, getCacheHeaders } from '@/lib/cache/cache'
import { logger } from '@/lib/logger';

// Rate limit configurations
const rateLimitConfigs = {
  auth: { windowMs: 60000, max: 5 }, // 5 requests per minute for auth
  api: { windowMs: 60000, max: 100 }, // 100 requests per minute for API
  payment: { windowMs: 60000, max: 10 }, // 10 requests per minute for payments
  webhook: { windowMs: 1000, max: 5 }, // 5 requests per second for webhooks
}

// =====================================================
// PERFORMANCE: Cache control configurations
// =====================================================
const CACHE_CONFIG = {
  // Static pages - longer cache
  static: { sMaxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, 1 day SWR

  // Event pages - medium cache
  events: { sMaxAge: 300, staleWhileRevalidate: 600 }, // 5 min, 10 min SWR

  // API routes - shorter cache
  api: { sMaxAge: 60, staleWhileRevalidate: 120 }, // 1 min, 2 min SWR

  // Auth routes - no cache
  auth: { sMaxAge: 0, staleWhileRevalidate: 0 },

  // Dynamic routes - very short cache
  dynamic: { sMaxAge: 30, staleWhileRevalidate: 60 }, // 30s, 1 min SWR
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // =====================================================
  // PERFORMANCE: Check HTTP cache first for GET requests
  // =====================================================
  if (request.method === 'GET' && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/webhooks/')) {
    const cachedResponse = await checkCache(request)
    if (cachedResponse) {
      return cachedResponse
    }
  }

  // Apply compression middleware
  const response = await compressionMiddleware(request)

  // =====================================================
  // PERFORMANCE: Route-based cache headers
  // =====================================================
  let cacheConfig

  if (pathname.startsWith('/api/auth/') || pathname.includes('/auth/')) {
    cacheConfig = CACHE_CONFIG.auth
  } else if (pathname.startsWith('/events/') || pathname.startsWith('/e/')) {
    cacheConfig = CACHE_CONFIG.events
  } else if (pathname.startsWith('/api/')) {
    cacheConfig = CACHE_CONFIG.api
  } else if (pathname.match(/^\/(dashboard|settings|profile)/)) {
    cacheConfig = CACHE_CONFIG.dynamic
  } else {
    // Static pages
    cacheConfig = CACHE_CONFIG.static
  }

  // Apply cache headers
  if (cacheConfig.sMaxAge > 0) {
    const headers = getCacheHeaders(cacheConfig.sMaxAge)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  } else {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  // Add performance hints
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Early hints for performance
  if (pathname === '/') {
    response.headers.append('Link', '</_next/static/css/app/layout.css>; rel=preload; as=style')
    response.headers.append('Link', '</_next/static/chunks/main.js>; rel=preload; as=script')
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=()'
  )

  // Add Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  )

  // Apply CSRF protection to API routes
  if (pathname.startsWith('/api/')) {
    const csrfResult = csrfMiddleware(request)
    if (csrfResult) return csrfResult
  }

  // Apply rate limiting based on route
  try {
    if (pathname.startsWith('/api/auth/')) {
      await rateLimit(request, 'auth', rateLimitConfigs.auth.max, rateLimitConfigs.auth.windowMs)
    } else if (pathname.startsWith('/api/payments/') || pathname.startsWith('/api/webhooks/')) {
      const config = pathname.startsWith('/api/payments/')
        ? rateLimitConfigs.payment
        : rateLimitConfigs.webhook
      await rateLimit(request, pathname, config.max, config.windowMs)
    } else if (pathname.startsWith('/api/')) {
      await rateLimit(request, 'api', rateLimitConfigs.api.max, rateLimitConfigs.api.windowMs)
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Continue with auth session management
  const sessionResponse = await updateSession(request)

  // Merge caching headers with session response
  if (sessionResponse && sessionResponse.headers) {
    // Copy all cache headers to session response
    response.headers.forEach((value, key) => {
      if (key.startsWith('Cache-Control') || key.startsWith('CDN-Cache-Control')) {
        sessionResponse.headers.set(key, value)
      }
    })

    sessionResponse.headers.set('X-DNS-Prefetch-Control', 'on')
    sessionResponse.headers.set('X-Frame-Options', 'DENY')
    sessionResponse.headers.set('X-Content-Type-Options', 'nosniff')
    sessionResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Add Content Security Policy
    sessionResponse.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.googleapis.com",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; ')
    )

    // =====================================================
    // PERFORMANCE: Store successful GET responses in cache
    // =====================================================
    if (request.method === 'GET' && sessionResponse.status === 200 && cacheConfig.sMaxAge > 0) {
      storeCache(request, sessionResponse).catch((error) => {
        logger.error('Failed to store cache:', error)
      })
    }

    return sessionResponse
  }

  // =====================================================
  // PERFORMANCE: Store response in cache for non-auth requests
  // =====================================================
  if (request.method === 'GET' && response.status === 200 && cacheConfig.sMaxAge > 0) {
    storeCache(request, response).catch((error) => {
      logger.error('Failed to store cache:', error)
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, fonts)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
