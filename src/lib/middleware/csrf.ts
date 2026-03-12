import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';

export function generateCSRFToken(): string {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('hex');
}

export function setCSRFToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  response.headers.set(CSRF_TOKEN_HEADER, token);
  return response;
}

export function verifyCSRFToken(request: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

export function csrfMiddleware(request: NextRequest): NextResponse | null {
  if (!verifyCSRFToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  return null;
}
