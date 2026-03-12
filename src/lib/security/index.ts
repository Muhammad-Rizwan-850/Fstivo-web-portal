import { logger } from '@/lib/logger';
// =====================================================
// FSTIVO SECURITY MODULE - MAIN EXPORT
// =====================================================
// Centralized exports for all security features
// =====================================================

// Cryptographic functions
export {
  generateJazzCashHash,
  generateJazzCashHashV2,
  verifyJazzCashCallback,
  generateEasypaisaHash,
  verifyEasypaisaCallback,
  generateSecureToken,
  generateCSRFToken,
  secureCompare,
  hashPassword,
  verifyPassword,
  generateApiKey,
  generateQRSecret,
  generateSessionId,
  encryptData,
  decryptData,
  generateFingerprint,
  validateChecksum,
  generateHMACSignature,
  maskSensitiveData,
} from './crypto';

// Webhook verification
export {
  stripe,
  verifyStripeWebhook,
  verifyJazzCashWebhook,
  verifyEasypaisaWebhook,
  validatePaymentAmount,
  isValidStripeEvent,
  isValidJazzCashResponse,
  isValidEasypaisaResponse,
  isDuplicateWebhook,
  webhookSuccess,
  webhookError,
  logWebhook,
  shouldRetryWebhook,
  validateWebhookHeaders,
} from './webhook-verification';

// Rate limiting
export {
  RateLimiter,
  RedisRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  webhookRateLimiter,
  publicRateLimiter,
  adminRateLimiter,
  emailRateLimiter,
  uploadRateLimiter,
  rateLimit,
  withRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';

// CSRF protection
export {
  generateCSRFCookie,
  getCSRFToken,
  getCSRFCookie,
  validateCSRFToken,
  csrfMiddleware,
  withCSRFProtection,
  refreshCSRFToken,
  addCSRFToHeaders,
  getCSRFTokenForClient,
  validateFormCSRF,
  DoubleSubmitCookieCSRF,
  CSRF_CONFIG,
  type CSRFValidationResult,
} from './csrf-protection';

// Authentication middleware
export {
  requireAuth,
  requireAdmin,
  requireEventOrganizer,
  requireTicketOwner,
  requirePermission,
  withAuth,
  withAdminAuth,
  withEventOrganizerAuth,
  validateSession,
  refreshSessionIfNeeded,
  hasPermission,
  type AuthResult,
  type AdminAuthResult,
} from './auth-middleware';

// Environment validation
export {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
  getSiteURL,
  getAppURL,
  isPaymentGatewayEnabled,
  getPaymentConfig,
  getEmailConfig,
  getNotificationConfig,
  getSecurityConfig,
  type Env,
} from './env-validator';

// SQL injection prevention
export {
  sanitizeInput,
  sanitizeSearchQuery,
  sanitizeArray,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  safeSearchAttendees,
  safeSearchEvents,
  safeGetAttendee,
  safeGetEvent,
  validateOrderBy,
  buildSafeFilters,
  executeSafeRawSQL,
} from './sql-injection-prevention';

// =====================================================
// SECURITY CONFIGURATION
// =====================================================

export const securityConfig = {
  // Rate limiting
  rateLimit: {
    enabled: true,
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    payment: { windowMs: 60 * 1000, maxRequests: 10 },
    webhook: { windowMs: 60 * 1000, maxRequests: 100 },
    public: { windowMs: 15 * 60 * 1000, maxRequests: 50 },
    admin: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },
    email: { windowMs: 60 * 60 * 1000, maxRequests: 50 },
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  },

  // CSRF
  csrf: {
    enabled: true,
    cookieName: 'csrf_token',
    headerName: 'x-csrf-token',
    tokenLength: 32,
  },

  // Webhooks
  webhooks: {
    stripe: { verifySignature: true },
    jazzcash: { verifyHash: true },
    easypaisa: { verifyHash: true },
  },

  // Payment validation
  payment: {
    amountValidation: {
      enabled: true,
      tolerance: 0.01, // 1%
    },
    minimumAmount: 1, // 1 PKR
    maximumAmount: 1000000, // 1M PKR
  },

  // Environment
  env: {
    validateOnStartup: true,
    failOnMissing: true,
  },
} as const;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Initialize all security features
 */
export async function initSecurity(): Promise<void> {
  // Validate environment
  // if (securityConfig.env.validateOnStartup) {
  //   validateEnv();
  // }

  // Log security status
  if (process.env.NODE_ENV !== 'test') {
    logger.info('🔒 Security features initialized:');
    logger.info(`  - CSRF Protection: ${securityConfig.csrf.enabled ? '✅' : '❌'}`);
    logger.info(`  - Rate Limiting: ${securityConfig.rateLimit.enabled ? '✅' : '❌'}`);
    logger.info(`  - Payment Validation: ${securityConfig.payment.amountValidation.enabled ? '✅' : '❌'}`);
    logger.info(`  - Webhook Verification: ✅`);
  }
}

// Auto-initialize on module load
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initSecurity();
}
