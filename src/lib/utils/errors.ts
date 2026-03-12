/**
 * Error handling utilities
 * Provides type-safe error extraction and formatting
 */

/**
 * Extract error message from unknown error type
 * Handles Error objects, strings, and other types safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Extract error code from unknown error type
 * Useful for API error responses
 */
export function getErrorCode(error: unknown): string | number {
  if (error instanceof Error && 'code' in error) {
    return (error as any).code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as any).code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('fetch') || error.message.includes('network');
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'ValidationError';
  }
  if (error && typeof error === 'object' && 'name' in error) {
    return (error as any).name === 'ValidationError';
  }
  return false;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): {
  message: string;
  code?: string | number;
  stack?: string;
  context?: Record<string, any>;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
    };
  }
  return {
    message: getErrorMessage(error),
    code: getErrorCode(error),
  };
}
