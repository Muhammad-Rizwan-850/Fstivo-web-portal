'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { logAuditEvent } from './audit-logger';
import { logger } from '@/lib/logger';

// ========================================
// PRIVACY SETTINGS
// ========================================

/**
 * Get user privacy settings
 */
export async function getUserPrivacySettings(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No settings exist, return defaults
    return {
      marketing_emails: false,
      analytics_tracking: true,
      personalized_ads: false,
      data_sharing: false,
      profile_visibility: 'public',
      show_activity: true,
      show_location: false,
      allow_search_indexing: true
    };
  }

  if (error) throw error;

  return data;
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Record<string, any>
) {
  const supabase = await createServerClient();

  // Get previous settings
  const previous = await getUserPrivacySettings(userId);

  // Update or insert settings
  const { data, error } = await supabase
    .from('user_privacy_settings')
    .upsert({
      user_id: userId,
      ...settings
    })
    .select()
    .single();

  if (error) throw error;

  // Log changes
  await logAuditEvent(
    userId,
    'privacy_settings_updated',
    'privacy_settings',
    data.id,
    { previous, new: settings }
  );

  return data;
}

/**
 * Check if user has given specific consent
 */
export async function hasConsent(userId: string, consentType: string): Promise<boolean> {
  const settings = await getUserPrivacySettings(userId);

  const consentMap: Record<string, keyof any> = {
    'marketing_emails': 'marketing_emails',
    'analytics': 'analytics_tracking',
    'personalized_ads': 'personalized_ads',
    'data_sharing': 'data_sharing'
  };

  const field = consentMap[consentType];
  return field ? (settings[field] as boolean) || false : false;
}

/**
 * Get consent history
 */
export async function getConsentHistory(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('consent_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return data;
}

// ========================================
// DATA EXPORT (GDPR Article 20)
// ========================================

/**
 * Request data export
 */
export async function requestDataExport(
  userId: string,
  requestType: 'full_export' | 'personal_data' | 'activity_logs' | 'transactions'
) {
  const supabase = await createServerClient();

  // Check if there's already a pending request
  const { data: existing } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existing) {
    throw new Error('You already have a pending export request');
  }

  // Create export request
  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: userId,
      request_type: requestType,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(
    userId,
    'data_export_requested',
    'data_export',
    data.id,
    { request_type: requestType }
  );

  return data;
}

/**
 * Process data export (background job)
 */
export async function processDataExport(requestId: string) {
  const supabase = await createServerClient();

  // Get request
  const { data: request } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) throw new Error('Export request not found');

  // Update status to processing
  await supabase
    .from('data_export_requests')
    .update({ status: 'processing' })
    .eq('id', requestId);

  try {
    // Gather all user data
    const userData = await gatherUserData(request.user_id, request.request_type);

    // Create JSON file
    const jsonContent = JSON.stringify(userData, null, 2);
    const fileName = `export_${request.user_id}_${Date.now()}.json`;

    // Upload to storage (you need to setup Supabase storage)
    const { data: uploadData } = await supabase.storage
      .from('data-exports')
      .upload(fileName, jsonContent, {
        contentType: 'application/json',
        upsert: false
      });

    // Generate signed URL (expires in 7 days)
    const { data: urlData } = await supabase.storage
      .from('data-exports')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (!urlData) {
      throw new Error('Failed to generate signed URL for export');
    }

    // Update request with file URL
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        file_url: urlData.signedUrl,
        file_size_bytes: jsonContent.length,
        processed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('id', requestId);

    await logAuditEvent(
      request.user_id,
      'data_export_completed',
      'data_export',
      requestId,
      { file_size: jsonContent.length }
    );

    return urlData.signedUrl;
  } catch (error) {
    logger.error('Error processing export:', error);

    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', requestId);

    throw error;
  }
}

/**
 * Gather user data for export
 */
async function gatherUserData(userId: string, exportType: string) {
  const supabase = await createServerClient();

  const data: Record<string, any> = {
    export_date: new Date().toISOString(),
    export_type: exportType
  };

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profile) {
    data.profile = profile;
  }

  // Get privacy settings
  const privacySettings = await getUserPrivacySettings(userId);
  data.privacy_settings = privacySettings;

  if (exportType === 'full_export' || exportType === 'activity_logs') {
    // Get audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    data.audit_logs = auditLogs || [];
  }

  if (exportType === 'full_export' || exportType === 'activity_logs') {
    // Get consent history
    const consentHistory = await getConsentHistory(userId);
    data.consent_history = consentHistory;
  }

  if (exportType === 'full_export' || exportType === 'transactions') {
    // Get payment transactions (if you have a transactions table)
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    data.transactions = transactions || [];
  }

  if (exportType === 'full_export') {
    // Get event registrations
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    data.event_registrations = registrations || [];
  }

  return data;
}

// ========================================
// DATA DELETION (GDPR Article 17)
// ========================================

/**
 * Request data deletion
 */
export async function requestDataDeletion(
  userId: string,
  deletionType: 'account' | 'specific_data' | 'activity_logs' | 'all_data',
  reason?: string
) {
  const supabase = await createServerClient();

  // Schedule deletion (30 days from now for grace period)
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 30);

  const { data, error } = await supabase
    .from('data_deletion_requests')
    .insert({
      user_id: userId,
      deletion_type: deletionType,
      reason: reason,
      scheduled_deletion_date: scheduledDate.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(
    userId,
    'data_deletion_requested',
    'data_deletion',
    data.id,
    { deletion_type: deletionType, reason }
  );

  return data;
}

/**
 * Process data deletion (admin only)
 */
export async function processDataDeletion(requestId: string, approvedBy: string) {
  const supabase = await createServerClient();

  // Get request
  const { data: request } = await supabase
    .from('data_deletion_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) throw new Error('Deletion request not found');

  // Update status
  await supabase
    .from('data_deletion_requests')
    .update({
      status: 'processing',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', requestId);

  try {
    // Create backup before deletion
    await createBackup(request.user_id);

    // Anonymize user data
    await supabase.rpc('anonymize_user_data', {
      p_user_id: request.user_id
    });

    // Update request
    await supabase
      .from('data_deletion_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    await logAuditEvent(
      request.user_id,
      'data_deletion_completed',
      'data_deletion',
      requestId,
      { approved_by: approvedBy }
    );
  } catch (error) {
    await supabase
      .from('data_deletion_requests')
      .update({
        status: 'failed',
        rejection_reason: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', requestId);

    throw error;
  }
}

/**
 * Create backup before deletion
 */
async function createBackup(userId: string) {
  const supabase = await createServerClient();

  // Gather all data
  const data = await gatherUserData(userId, 'full_export');

  // Upload to backup storage
  const fileName = `backup_${userId}_${Date.now()}.json`;
  const jsonContent = JSON.stringify(data, null, 2);

  const { data: uploadData } = await supabase.storage
    .from('data-backups')
    .upload(fileName, jsonContent, {
      contentType: 'application/json',
      upsert: false
    });

  // Generate signed URL (never expires for backups)
  const { data: urlData } = await supabase.storage
    .from('data-backups')
    .createSignedUrl(fileName, 31536000); // 1 year

  return urlData?.signedUrl;
}

// ========================================
// PRIVACY POLICY
// ========================================

/**
 * Get active privacy policy
 */
export async function getActivePrivacyPolicy() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('privacy_policy_versions')
    .select('*')
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Log consent change
 */
export async function logConsentChange(
  userId: string,
  consentType: string,
  action: 'granted' | 'revoked' | 'updated',
  previousValue: Record<string, any> | null = null,
  newValue: Record<string, any> | null = null
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('log_consent_change', {
    p_user_id: userId,
    p_consent_type: consentType,
    p_action: action,
    p_previous_value: previousValue,
    p_new_value: newValue
  });

  if (error) logger.error('Error logging consent change:', error);

  return data;
}

// ========================================
// COOKIE CONSENT
// ========================================

/**
 * Save cookie consent
 */
export async function saveCookieConsent(
  userId: string | null,
  sessionId: string | null,
  consent: Record<string, any>
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('cookie_consents')
    .insert({
      user_id: userId,
      session_id: sessionId,
      necessary_cookies: consent.necessary ?? true,
      functional_cookies: consent.functional ?? false,
      analytics_cookies: consent.analytics ?? false,
      marketing_cookies: consent.marketing ?? false,
      consent_version: consent.version || '1.0'
    })
    .select()
    .single();

  if (error) {
    logger.error('Error saving cookie consent:', error);
    return null;
  }

  if (userId) {
    await logConsentChange(
      userId,
      'cookie_consent',
      'granted',
      null,
      consent
    );
  }

  return data;
}

/**
 * Get latest cookie consent
 */
export async function getCookieConsent(userId: string | null, sessionId?: string) {
  const supabase = await createServerClient();

  let query = supabase
    .from('cookie_consents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return null;
  }

  const { data, error } = await query.single();

  if (error) return null;

  return data;
}
