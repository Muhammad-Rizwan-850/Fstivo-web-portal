'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Log audit event
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  changes: Record<string, any> | null = null,
  metadata: Record<string, any> = {}
) {
  const supabase = await createServerClient();

  // Get IP and user agent from headers
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
  const userAgent = headersList.get('user-agent') || null;

  const { data, error } = await supabase.rpc('log_audit_event', {
    p_user_id: userId,
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_changes: changes,
    p_metadata: { ...metadata, ipAddress, userAgent }
  });

  if (error) {
    logger.error('Error logging audit event:', error);
  }

  return data;
}

/**
 * Log security event (convenience function)
 */
export async function logSecurityEvent(
  userId: string,
  event: string,
  details: Record<string, any> = {}
) {
  return logAuditEvent(userId, event, 'security', null, details);
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  userId: string | null,
  action: 'login' | 'logout' | 'failed_login' | 'password_reset' | '2fa_enabled' | '2fa_disabled',
  metadata: Record<string, any> = {}
) {
  return logAuditEvent(userId, action, 'authentication', null, null, metadata);
}

/**
 * Log data access event
 */
export async function logDataAccess(
  userId: string,
  resourceType: string,
  action: string,
  resourceId: string | null = null
) {
  return logAuditEvent(userId, `data_${action}`, resourceType, resourceId);
}
