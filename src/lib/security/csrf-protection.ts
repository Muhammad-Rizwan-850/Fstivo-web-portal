// =====================================================
// FSTIVO SECURITY - CSRF PROTECTION
// =====================================================
// Cross-Site Request Forgery protection
// Generates and validates CSRF tokens
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, secureCompare } from './crypto';

// =====================================================
// CSRF CONFIGURATION
// =====================================================

const CSRF_CONFIG = {
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

// =====================================================
// CSRF TOKEN GENERATION
// =====================================================

/**
 * Generate new CSRF token and set cookie
 */
export function generateCSRFCookie(): Response {
  const token = generateCSRFToken();

  const response = NextResponse.json({
    success: true,
    message: 'CSRF token generated',
  });

  response.cookies.set(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);

  return response;
}

/**
 * Get CSRF token from request
 */
export async function getCSRFToken(request: NextRequest): Promise<string | null> {
  // Try header first
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);
  if (headerToken) {
    return headerToken;
  }

  // Try body (for form submissions)
  try {
    const body = await request.json();
    return body.csrfToken || null;
  } catch {
    return null;
  }
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_CONFIG.cookieName)?.value || null;
}

// =====================================================
// CSRF VALIDATION
// =====================================================

export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(request: NextRequest): Promise<CSRFValidationResult> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  // Get token from header or body
  const token = await getCSRFToken(request);

  if (!token) {
    return {
      valid: false,
      error: 'CSRF token missing from request',
    };
  }

  // Get token from cookie
  const cookieToken = getCSRFCookie(request);

  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token missing from cookie',
    };
  }

  // Compare tokens using timing-safe comparison
  if (!secureCompare(token, cookieToken)) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * Middleware to add CSRF protection
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const validation = await validateCSRFToken(request);

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        details: validation.error,
      },
      { status: 403 }
    );
  }

  return null; // Allow request to proceed
}

// =====================================================
// CSRF PROTECTION FOR API ROUTES
// =====================================================

/**
 * HOC to add CSRF protection to API routes
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate CSRF token
    const validation = await validateCSRFToken(request);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          details: validation.error,
        },
        { status: 403 }
      );
    }

    // Call original handler
    return handler(request);
  };
}

// =====================================================
// CSRF TOKEN REFRESH
// =====================================================

/**
 * Refresh CSRF token
 */
export function refreshCSRFToken(request: NextRequest): NextResponse {
  const newToken = generateCSRFToken();

  const response = NextResponse.json({
    success: true,
    message: 'CSRF token refreshed',
  });

  response.cookies.set(CSRF_CONFIG.cookieName, newToken, CSRF_CONFIG.cookieOptions);

  return response;
}

// =====================================================
// CSRF-AWARE RESPONSE
// =====================================================

/**
 * Add CSRF token to response headers
 * Useful for single-page apps
 */
export function addCSRFToHeaders(response: NextResponse, token: string): NextResponse {
  response.headers.set('X-CSRF-Token', token);
  return response;
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFTokenForClient(): Promise<{ token: string; headerName: string }> {
  const token = generateCSRFToken();

  return {
    token,
    headerName: CSRF_CONFIG.headerName,
  };
}

// =====================================================
// CSRF PROTECTION FOR FORM SUBMISSIONS
// =====================================================

/**
 * Validate CSRF for form submissions
 */
export function validateFormCSRF(formData: FormData, request: NextRequest): CSRFValidationResult {
  const formToken = formData.get('csrf_token') as string;

  if (!formToken) {
    return {
      valid: false,
      error: 'CSRF token missing from form',
    };
  }

  const cookieToken = getCSRFCookie(request);

  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token missing from cookie',
    };
  }

  if (!secureCompare(formToken, cookieToken)) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

// =====================================================
// DOUBLE SUBMIT COOKIE PATTERN
// =====================================================

/**
 * Implement double submit cookie pattern
 * Token is stored in cookie and sent in header/body
 */
export class DoubleSubmitCookieCSRF {
  /**
   * Generate token for double submit
   */
  static generate(): string {
    return generateCSRFToken();
  }

  /**
   * Validate double submit cookie
   */
  static validate(request: NextRequest): CSRFValidationResult {
    const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value;
    const headerToken = request.headers.get(CSRF_CONFIG.headerName);

    if (!cookieToken) {
      return {
        valid: false,
        error: 'CSRF cookie missing',
      };
    }

    if (!headerToken) {
      return {
        valid: false,
        error: 'CSRF header missing',
      };
    }

    if (!secureCompare(cookieToken, headerToken)) {
      return {
        valid: false,
        error: 'CSRF tokens do not match',
      };
    }

    return { valid: true };
  }

  /**
   * Set double submit cookie
   */
  static setCookie(response: NextResponse, token: string): NextResponse {
    response.cookies.set(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);
    return response;
  }
}

// =====================================================
// CSRF PROTECTION MIDDLEWARE
// =====================================================

/**
 * Next.js middleware for CSRF protection
 */
export async function csrfProtectionMiddleware(request: NextRequest) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }

  // Skip for API routes that use other authentication (e.g., webhooks)
  const webhookPaths = ['/api/webhooks', '/api/stripe', '/api/jazzcash', '/api/easypaisa'];
  if (webhookPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return null;
  }

  // Validate CSRF
  const validation = await validateCSRFToken(request);

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        details: validation.error,
      },
      { status: 403 }
    );
  }

  return null;
}

// =====================================================
// CLIENT-SIDE CSRF HELPERS
// =====================================================

/**
 * Generate HTML meta tag for CSRF
 */
export function generateCSRFMetaTag(token: string): string {
  return `<meta name="csrf-token" content="${token}">`;
}

/**
 * Generate hidden input field for forms
 */
export function generateCSRFHiddenInput(token: string): string {
  return `<input type="hidden" name="csrf_token" value="${token}">`;
}

// =====================================================
// EXPORTS
// =====================================================

export {
  CSRF_CONFIG,
};

// Types and classes are already exported at their declarations
