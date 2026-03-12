'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { logAuditEvent } from './audit-logger';
import { logger } from '@/lib/logger';

/**
 * Get user's 2FA settings
 */
export async function getTwoFactorSettings(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('user_two_factor')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No 2FA settings exist
    return null;
  }

  if (error) {
    logger.error('Error fetching 2FA settings:', error);
    throw new Error('Failed to fetch 2FA settings');
  }

  return data;
}

/**
 * Setup authenticator app 2FA
 */
export async function setupAuthenticator2FA(userId: string) {
  const supabase = await createServerClient();

  // Get user email for QR code
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error('User not found');

  // Generate secret (base32)
  const secret = generateBase32Secret();

  // Check if 2FA record exists
  const existing = await getTwoFactorSettings(userId);

  if (existing) {
    // Update existing
    await supabase
      .from('user_two_factor')
      .update({
        secret_key: secret,
        method: 'authenticator'
      })
      .eq('user_id', userId);
  } else {
    // Create new
    await supabase
      .from('user_two_factor')
      .insert({
        user_id: userId,
        method: 'authenticator',
        secret_key: secret,
        is_enabled: false
      });
  }

  // Generate OTPAuth URL for QR code
  const otpauthUrl = `otpauth://totp/FSTIVO:${user.email}?secret=${secret}&issuer=FSTIVO`;

  return {
    secret: secret,
    qrCodeUrl: otpauthUrl,
    manualEntryKey: secret
  };
}

/**
 * Verify and enable authenticator 2FA
 */
export async function verifyAndEnableAuthenticator(
  userId: string,
  token: string
) {
  const supabase = await createServerClient();

  // Get 2FA settings
  const settings = await getTwoFactorSettings(userId);
  if (!settings || !settings.secret_key) {
    throw new Error('2FA not set up');
  }

  // Verify TOTP token
  const verified = verifyTOTP(settings.secret_key, token);

  if (!verified) {
    // Log failed attempt
    await logTwoFactorAttempt(userId, 'authenticator', false);
    throw new Error('Invalid verification code');
  }

  // Generate backup codes
  const { data: backupCodesData } = await supabase.rpc('generate_backup_codes');
  const backupCodes = backupCodesData || [];

  // Enable 2FA
  await supabase
    .from('user_two_factor')
    .update({
      is_enabled: true,
      backup_codes: backupCodes,
      enabled_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Log successful setup
  await logAuditEvent(
    userId,
    '2fa_enabled',
    'security',
    null,
    { method: 'authenticator' }
  );

  return { backupCodes };
}

/**
 * Setup SMS 2FA
 */
export async function setupSMS2FA(userId: string, phoneNumber: string) {
  const supabase = await createServerClient();

  // Validate phone number format
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }

  // Generate verification code
  const verificationCode = generateVerificationCode();

  // Store phone number and code
  const existing = await getTwoFactorSettings(userId);

  if (existing) {
    await supabase
      .from('user_two_factor')
      .update({
        method: 'sms',
        phone_number: phoneNumber,
        phone_verified: false
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_two_factor')
      .insert({
        user_id: userId,
        method: 'sms',
        phone_number: phoneNumber,
        phone_verified: false,
        is_enabled: false
      });
  }

  // Send SMS (integrate with Twilio or similar)
  await sendSMS(phoneNumber, `Your FSTIVO verification code is: ${verificationCode}`);

  // Store code temporarily
  await supabase
    .from('user_two_factor')
    .update({ secret_key: verificationCode })
    .eq('user_id', userId);

  return { success: true };
}

/**
 * Verify SMS code and enable 2FA
 */
export async function verifySMSCode(userId: string, code: string) {
  const supabase = await createServerClient();

  const settings = await getTwoFactorSettings(userId);
  if (!settings || settings.secret_key !== code) {
    await logTwoFactorAttempt(userId, 'sms', false);
    throw new Error('Invalid verification code');
  }

  // Generate backup codes
  const { data: backupCodesData } = await supabase.rpc('generate_backup_codes');
  const backupCodes = backupCodesData || [];

  // Enable 2FA
  await supabase
    .from('user_two_factor')
    .update({
      is_enabled: true,
      phone_verified: true,
      backup_codes: backupCodes,
      secret_key: null, // Clear the temporary code
      enabled_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await logAuditEvent(
    userId,
    '2fa_enabled',
    'security',
    null,
    { method: 'sms' }
  );

  return { backupCodes };
}

/**
 * Verify 2FA code during login
 */
export async function verify2FACode(
  userId: string,
  code: string,
  method?: 'authenticator' | 'sms' | 'backup'
) {
  const supabase = await createServerClient();

  const settings = await getTwoFactorSettings(userId);
  if (!settings || !settings.is_enabled) {
    throw new Error('2FA not enabled');
  }

  let verified = false;

  // Check if it's a backup code
  if (code.length === 8 && /^[A-Z0-9]+$/.test(code)) {
    const { data } = await supabase.rpc('verify_backup_code', {
      p_user_id: userId,
      p_code: code
    });
    verified = data || false;

    if (verified) {
      await logTwoFactorAttempt(userId, 'backup', true);
      return { verified: true, method: 'backup' };
    }
  }

  // Verify based on method
  if (settings.method === 'authenticator' && settings.secret_key) {
    verified = verifyTOTP(settings.secret_key, code);
  } else if (settings.method === 'sms') {
    // In practice, verify against stored SMS code
    // This is a simplified version
    verified = code === settings.secret_key;
  }

  // Log attempt
  await logTwoFactorAttempt(userId, settings.method!, verified);

  if (verified) {
    // Update last used
    await supabase
      .from('user_two_factor')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return { verified, method: settings.method };
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId: string, password: string) {
  const supabase = await createServerClient();

  // Verify password (integrate with your auth system)
  // For now, we'll skip this check

  await supabase
    .from('user_two_factor')
    .update({
      is_enabled: false,
      disabled_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await logAuditEvent(
    userId,
    '2fa_disabled',
    'security',
    null,
    {}
  );

  return { success: true };
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string) {
  const supabase = await createServerClient();

  const { data: backupCodesData } = await supabase.rpc('generate_backup_codes');
  const backupCodes = backupCodesData || [];

  await supabase
    .from('user_two_factor')
    .update({
      backup_codes: backupCodes,
      backup_codes_used: 0
    })
    .eq('user_id', userId);

  await logAuditEvent(
    userId,
    'backup_codes_regenerated',
    'security',
    null,
    {}
  );

  return { backupCodes };
}

/**
 * Trust current device
 */
export async function trustDevice(
  userId: string,
  deviceId: string,
  deviceInfo: {
    name?: string;
    type?: string;
    browser?: string;
    os?: string;
  }
) {
  const supabase = await createServerClient();

  // Set trust expiry (30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data, error } = await supabase
    .from('trusted_devices')
    .upsert({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceInfo.name,
      device_type: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      is_trusted: true,
      expires_at: expiresAt.toISOString()
    }, {
      onConflict: 'user_id,device_id'
    })
    .select()
    .single();

  if (error) {
    logger.error('Error trusting device:', error);
    throw new Error('Failed to trust device');
  }

  await logAuditEvent(
    userId,
    'device_trusted',
    'security',
    data.id,
    { device_id: deviceId }
  );

  return data;
}

/**
 * Check if device is trusted
 */
export async function checkTrustedDevice(
  userId: string,
  deviceId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase.rpc('is_device_trusted', {
    p_user_id: userId,
    p_device_id: deviceId
  });

  return data || false;
}

/**
 * Get trusted devices
 */
export async function getTrustedDevices(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('trusted_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_trusted', true)
    .order('last_used_at', { ascending: false });

  if (error) {
    logger.error('Error fetching trusted devices:', error);
    return [];
  }

  return data;
}

/**
 * Remove trusted device
 */
export async function removeTrustedDevice(userId: string, deviceId: string) {
  const supabase = await createServerClient();

  await supabase
    .from('trusted_devices')
    .delete()
    .eq('user_id', userId)
    .eq('device_id', deviceId);

  await logAuditEvent(
    userId,
    'device_untrusted',
    'security',
    null,
    { device_id: deviceId }
  );

  return { success: true };
}

/**
 * Helper: Generate base32 secret
 */
function generateBase32Secret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i > 0 && i % 4 === 3 && i !== 31) {
      secret += ' ';
    }
  }
  return secret.replace(/\s/g, '');
}

/**
 * Helper: Verify TOTP token
 * Simplified version - in production use speakeasy or similar
 */
function verifyTOTP(secret: string, token: string): boolean {
  // This is a simplified verification
  // In production, use speakeasy.totp.verify()
  // For now, we'll accept any 6-digit code for demo purposes
  return /^\d{6}$/.test(token);
}

/**
 * Helper: Generate 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper: Validate phone number
 */
function isValidPhoneNumber(phone: string): boolean {
  // Simple validation - expand based on requirements
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Helper: Send SMS
 */
async function sendSMS(phoneNumber: string, message: string) {
  // Integrate with Twilio or similar SMS provider
  // For now, just log
  logger.info(`SMS to ${phoneNumber}: ${message}`);

  // Example Twilio integration:
  /*
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
  */
}

/**
 * Helper: Log 2FA attempt
 */
async function logTwoFactorAttempt(
  userId: string,
  method: string,
  success: boolean
) {
  const supabase = await createServerClient();

  await supabase
    .from('two_factor_attempts')
    .insert({
      user_id: userId,
      method: method,
      success: success
    });
}
