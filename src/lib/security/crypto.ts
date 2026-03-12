// =====================================================
// FSTIVO SECURITY - CRYPTOGRAPHIC FUNCTIONS
// =====================================================
// JazzCash hash generation and verification
// Fixes weak cryptography issues
// =====================================================

import crypto from 'crypto';

/**
 * Generate JazzCash secure hash using HMAC SHA256
 * @deprecated Use generateJazzCashHashV2 instead
 */
export function generateJazzCashHash(
  merchantId: string,
  password: string,
  amount: string,
  billReference: string,
  txnDateTime: string,
  integrityKey: string
): string {
  // Create HMAC SHA256 hash instead of base64
  const dataString = `${integrityKey}&${amount}&${billReference}&${txnDateTime}&${merchantId}&${password}`;

  const hash = crypto
    .createHmac('sha256', integrityKey)
    .update(dataString)
    .digest('hex')
    .toUpperCase();

  return hash;
}

/**
 * Generate JazzCash hash (V2 - improved)
 * Follows official JazzCash documentation
 */
export function generateJazzCashHashV2(params: Record<string, string>, integrityKey: string): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Create concatenated string
  const dataString = sortedKeys
    .map(key => params[key])
    .join('&');

  // Add integrity key prefix
  const finalString = `${integrityKey}&${dataString}`;

  // Generate HMAC SHA256 hash
  const hash = crypto
    .createHmac('sha256', integrityKey)
    .update(finalString)
    .digest('hex')
    .toUpperCase();

  return hash;
}

/**
 * Verify JazzCash callback signature
 */
export function verifyJazzCashCallback(
  callbackData: Record<string, string>,
  integrityKey: string
): boolean {
  const receivedHash = callbackData.pp_SecureHash;

  if (!receivedHash) {
    return false;
  }

  // Reconstruct data string from callback
  const sortedKeys = Object.keys(callbackData)
    .filter(key => key !== 'pp_SecureHash')
    .sort();

  const dataString = sortedKeys
    .map(key => callbackData[key])
    .join('&');

  const expectedHash = crypto
    .createHmac('sha256', integrityKey)
    .update(`${integrityKey}&${dataString}`)
    .digest('hex')
    .toUpperCase();

  // Use timing-safe comparison to prevent timing attacks
  return secureCompare(receivedHash, expectedHash);
}

/**
 * Generate Easypaisa secure hash
 */
export function generateEasypaisaHash(
  params: Record<string, string>,
  hashKey: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const dataString = sortedKeys.map(key => params[key]).join('&');

  const hash = crypto
    .createHmac('sha256', hashKey)
    .update(dataString)
    .digest('hex')
    .toUpperCase();

  return hash;
}

/**
 * Verify Easypaisa callback signature
 */
export function verifyEasypaisaCallback(
  callbackData: Record<string, string>,
  hashKey: string
): boolean {
  const receivedHash = callbackData.hash;

  if (!receivedHash) {
    return false;
  }

  const dataToHash = { ...callbackData };
  delete dataToHash.hash;

  const expectedHash = generateEasypaisaHash(dataToHash, hashKey);

  return secureCompare(receivedHash, expectedHash);
}

/**
 * Generate secure random token
 * Uses cryptographically secure random number generator
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Hash password using bcrypt (via Web Crypto API for edge compatibility)
 * For production, use bcrypt or argon2
 */
export async function hashPassword(password: string): Promise<string> {
  // This is a simplified version
  // In production, use: bcrypt.hash(password, 10)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.PASSWORD_SALT || 'default-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return secureCompare(passwordHash, hash);
}

/**
 * Generate API key for users
 */
export function generateApiKey(): string {
  const prefix = 'fst_';
  const token = generateSecureToken(24);
  return `${prefix}${token}`;
}

/**
 * Generate QR code secret
 */
export function generateQRSecret(): string {
  return generateSecureToken(16);
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return generateSecureToken(32);
}

/**
 * Encrypt sensitive data (for internal use)
 * Note: In production, use proper encryption libraries
 */
export function encryptData(data: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, encryptionKey: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate fingerprint for session verification
 */
export function generateFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}:${ip}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Validate data integrity checksum
 */
export function validateChecksum(data: string, checksum: string, secret: string): boolean {
  const expectedChecksum = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  return secureCompare(checksum, expectedChecksum);
}

/**
 * Generate HMAC signature for API requests
 */
export function generateHMACSignature(
  method: string,
  url: string,
  body: string,
  timestamp: number,
  secret: string
): string {
  const payload = `${method}\n${url}\n${body}\n${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  return signature;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}
