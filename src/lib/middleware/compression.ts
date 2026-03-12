// ========== src/lib/middleware/compression.ts ==========
// Response compression middleware

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function compressionMiddleware(request: NextRequest) {
  // This is handled by Next.js automatically in production
  // But we can add custom headers for CDN
  const response = NextResponse.next();

  // Add compression hints for CDN
  response.headers.set('Accept-Encoding', 'gzip, deflate, br');

  // Cache control headers
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    // API routes - short cache
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - long cache
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$/)) {
    // Images - medium cache
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=604800'
    );
  } else {
    // Pages - short cache with revalidation
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=59'
    );
  }

  return response;
}
