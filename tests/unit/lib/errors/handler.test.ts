import {
  AppError,
  ErrorType,
  validationError,
  authenticationError,
  authorizationError,
  notFoundError,
  conflictError,
  rateLimitError,
  paymentError,
  databaseError,
  internalError,
  parseError,
  formatErrorResponse,
} from '@/lib/errors/handler';

jest.mock('@/lib/utils/logger');
jest.mock('sonner');

describe('Error Handler', () => {
  describe('AppError class', () => {
    it('creates validation error', () => {
      const error = new AppError(ErrorType.VALIDATION, 'Invalid email', 400);
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid email');
    });

    it('includes details in error', () => {
      const error = new AppError(
        ErrorType.VALIDATION,
        'Invalid input',
        400,
        { field: 'email', reason: 'Invalid format' }
      );
      expect(error.details).toBeDefined();
      expect(error.details.field).toBe('email');
    });
  });

  describe('Error factory functions', () => {
    it('creates validation error', () => {
      const error = validationError('Email is required');
      expect(error).toBeInstanceOf(AppError);
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
    });

    it('creates authentication error', () => {
      const error = authenticationError('Invalid credentials');
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.statusCode).toBe(401);
    });

    it('creates authorization error', () => {
      const error = authorizationError('Insufficient permissions');
      expect(error.type).toBe(ErrorType.AUTHORIZATION);
      expect(error.statusCode).toBe(403);
    });

    it('creates not found error', () => {
      const error = notFoundError('User not found');
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('creates conflict error', () => {
      const error = conflictError('Email already exists');
      expect(error.type).toBe(ErrorType.CONFLICT);
      expect(error.statusCode).toBe(409);
    });

    it('creates rate limit error', () => {
      const error = rateLimitError('Too many requests');
      expect(error.type).toBe(ErrorType.RATE_LIMIT);
      expect(error.statusCode).toBe(429);
    });

    it('creates payment error', () => {
      const error = paymentError('Test');
      expect(error.type).toBe(ErrorType.PAYMENT);
      expect(error.statusCode).toBe(400);
    });

    it('creates database error', () => {
      const error = databaseError('Query failed');
      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.statusCode).toBe(500);
    });

    it('creates internal error', () => {
      const error = internalError('Unexpected error');
      expect(error.type).toBe(ErrorType.INTERNAL);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('parseError', () => {
    it('parses AppError instances', () => {
      const original = validationError('Test error');
      const parsed = parseError(original);
      expect(parsed).toBeInstanceOf(AppError);
    });

    it('wraps regular errors as internal error', () => {
      const error = new Error('Regular error');
      const parsed = parseError(error);
      expect(parsed.type).toBe(ErrorType.INTERNAL);
    });

    it('handles non-error values', () => {
      const parsed = parseError('string error');
      expect(parsed).toBeInstanceOf(AppError);
    });
  });

  describe('formatErrorResponse', () => {
    it('formats AppError response', () => {
      const error = validationError('Email is invalid');
      const formatted = formatErrorResponse(error) as any;

      expect(formatted).toHaveProperty('error');
      expect(formatted).toHaveProperty('statusCode', 400);
      expect(formatted).toHaveProperty('type', ErrorType.VALIDATION);
    });

    it('formats regular error response', () => {
      const error = new Error('Something went wrong');
      const formatted = formatErrorResponse(error) as any;

      expect(formatted.statusCode).toBe(500);
      expect(formatted).toHaveProperty('error');
    });

    it('includes error message in formatted response', () => {
      const error = paymentError('Card declined');
      const formatted = formatErrorResponse(error) as any;

      expect(formatted.error).toBe('Card declined');
    });
  });

  describe('Error messages', () => {
    it('validation error has 400 status', () => {
      const error = validationError('Test');
      expect(error.statusCode).toBe(400);
    });

    it('authentication error has 401 status', () => {
      const error = authenticationError('Test');
      expect(error.statusCode).toBe(401);
    });

    it('authorization error has 403 status', () => {
      const error = authorizationError('Test');
      expect(error.statusCode).toBe(403);
    });

    it('not found error has 404 status', () => {
      const error = notFoundError('Test');
      expect(error.statusCode).toBe(404);
    });

    it('conflict error has 409 status', () => {
      const error = conflictError('Test');
      expect(error.statusCode).toBe(409);
    });

    it('rate limit error has 429 status', () => {
      const error = rateLimitError('Test');
      expect(error.statusCode).toBe(429);
    });

    it('payment error has 400 status', () => {
      const error = paymentError('Test');
      expect(error.statusCode).toBe(400);
    });

    it('database error has 500 status', () => {
      const error = databaseError('Test');
      expect(error.statusCode).toBe(500);
    });

    it('internal error has 500 status', () => {
      const error = internalError('Test');
      expect(error.statusCode).toBe(500);
    });
  });
});
