// =====================================================
// ERROR HANDLING SYSTEM
// =====================================================
// Centralized error handling with toast notifications
// Provides consistent error responses
// =====================================================

import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// Custom error class
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error messages map
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Invalid input data',
  [ErrorType.AUTHENTICATION]: 'Authentication failed',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action',
  [ErrorType.NOT_FOUND]: 'Resource not found',
  [ErrorType.CONFLICT]: 'Resource already exists',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please try again later',
  [ErrorType.PAYMENT]: 'Payment processing failed',
  [ErrorType.DATABASE]: 'Database error',
  [ErrorType.INTERNAL]: 'An unexpected error occurred',
};

/**
 * Handle error and show toast notification
 */
export function handleError(error: unknown, context?: string): void {
  // Log error
  logger.error(context || 'Error occurred', error instanceof Error ? error : new Error(String(error)));

  // Show toast notification
  if (error instanceof AppError) {
    toast.error(error.message || errorMessages[error.type]);
  } else if (error instanceof Error) {
    toast.error(error.message || 'An unexpected error occurred');
  } else {
    toast.error('An unexpected error occurred');
  }
}

/**
 * Handle server action error
 */
export function handleActionError(error: unknown): { success: false; error: string } {
  if (error instanceof AppError) {
    logger.error('Action error', error, { type: error.type });
    return { success: false, error: error.message };
  }

  if (error instanceof Error) {
    logger.error('Action error', error);
    return { success: false, error: error.message };
  }

  logger.error('Unknown action error', new Error(String(error)));
  return { success: false, error: 'An unexpected error occurred' };
}

/**
 * Create validation error
 */
export function validationError(message: string, details?: any): AppError {
  return new AppError(ErrorType.VALIDATION, message, 400, details);
}

/**
 * Create authentication error
 */
export function authenticationError(message: string = 'Authentication failed'): AppError {
  return new AppError(ErrorType.AUTHENTICATION, message, 401);
}

/**
 * Create authorization error
 */
export function authorizationError(message: string = 'You do not have permission'): AppError {
  return new AppError(ErrorType.AUTHORIZATION, message, 403);
}

/**
 * Create not found error
 */
export function notFoundError(message: string = 'Resource not found'): AppError {
  return new AppError(ErrorType.NOT_FOUND, message, 404);
}

/**
 * Create conflict error
 */
export function conflictError(message: string = 'Resource already exists'): AppError {
  return new AppError(ErrorType.CONFLICT, message, 409);
}

/**
 * Create rate limit error
 */
export function rateLimitError(message: string = 'Too many requests'): AppError {
  return new AppError(ErrorType.RATE_LIMIT, message, 429);
}

/**
 * Create payment error
 */
export function paymentError(message: string = 'Payment failed'): AppError {
  return new AppError(ErrorType.PAYMENT, message, 400);
}

/**
 * Create database error
 */
export function databaseError(message: string = 'Database error'): AppError {
  return new AppError(ErrorType.DATABASE, message, 500);
}

/**
 * Create internal error
 */
export function internalError(message: string = 'Internal server error'): AppError {
  return new AppError(ErrorType.INTERNAL, message, 500);
}

/**
 * Parse error from unknown type
 */
export function parseError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(ErrorType.INTERNAL, error.message);
  }

  return new AppError(ErrorType.INTERNAL, String(error));
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  type?: ErrorType;
  statusCode: number;
  details?: any;
} {
  const appError = parseError(error);

  return {
    error: appError.message,
    type: appError.type,
    statusCode: appError.statusCode,
    details: appError.details,
  };
}
