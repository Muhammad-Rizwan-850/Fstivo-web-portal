/**
 * Structured Payment Error Responses
 * ───────────────────────────────────
 * Audit: "Unclear error handling in several API routes — generic errors or
 * log nulls without actionable fallbacks."
 *
 * This module standardizes payment error responses so:
 *   • Errors are JSON with a clear `error` + `code` field
 *   • User-facing messages are safe (no secrets leaked)
 *   • Server logs get the full stack trace
 */

export interface PaymentError {
  error:   string;           // user-facing message
  code:    string;           // machine-readable code
  details?: Record<string, unknown>;  // optional debug info (dev only)
}

export const ErrorCodes = {
  AUTH_FAILED:           'AUTH_FAILED',
  INVALID_AMOUNT:        'INVALID_AMOUNT',
  PAYMENT_PROVIDER_DOWN: 'PAYMENT_PROVIDER_DOWN',
  WEBHOOK_SIG_INVALID:   'WEBHOOK_SIG_INVALID',
  ORDER_NOT_FOUND:       'ORDER_NOT_FOUND',
  DUPLICATE_PAYMENT:     'DUPLICATE_PAYMENT',
  INSUFFICIENT_BALANCE:  'INSUFFICIENT_BALANCE',
  INTERNAL_ERROR:        'INTERNAL_ERROR',
} as const;

/**
 * Build a standardized error response.
 * Logs the full error server-side; returns safe message to client.
 */
export function paymentError(
  code: keyof typeof ErrorCodes,
  userMessage: string,
  internalError?: unknown
): Response {
  // Log full details server-side
  if (internalError) {
    console.error(`[PaymentError ${code}]`, internalError);
  }

  // Return safe JSON to client
  const payload: PaymentError = {
    error: userMessage,
    code:  ErrorCodes[code],
  };

  // In dev mode, include stack trace
  if (process.env.NODE_ENV === 'development' && internalError instanceof Error) {
    payload.details = { stack: internalError.stack };
  }

  const statusMap: Record<string, number> = {
    AUTH_FAILED:           401,
    INVALID_AMOUNT:        400,
    PAYMENT_PROVIDER_DOWN: 503,
    WEBHOOK_SIG_INVALID:   401,
    ORDER_NOT_FOUND:       404,
    DUPLICATE_PAYMENT:     409,
    INSUFFICIENT_BALANCE:  402,
    INTERNAL_ERROR:        500,
  };

  return new Response(JSON.stringify(payload), {
    status: statusMap[code] ?? 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
