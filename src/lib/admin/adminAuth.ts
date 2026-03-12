/**
 * FSTIVO Admin Authentication & Authorization Utilities
 */

import { createClient } from '@/lib/auth/config'
import { cache } from 'react'
import { getErrorMessage } from '@/lib/utils/errors'
import { logger } from '@/lib/logger';

// -----------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminPermission {
  user_id: string
  role: AdminRole
  permissions: Record<string, boolean>
  granted_at: string
  granted_by: string
}

export interface AdminActivity {
  id: string
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  details?: Record<string, any>
  ip_address?: string
  created_at: string
}

// -----------------------------------------------------------------------------
// ADMIN AUTHENTICATION
// ------------------------------------------------------------------------------

/**
 * Check if user is an admin (any role)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('admin_permissions')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error || !data) return false

    return ['super_admin', 'admin', 'moderator'].includes((data as any).role)
  } catch {
    return false
  }
}

/**
 * Check if user has specific admin role or higher
 */
export async function hasAdminRole(
  userId: string,
  requiredRole: AdminRole
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('admin_permissions')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error || !data) return false

    const roleHierarchy: Record<AdminRole, number> = {
      moderator: 1,
      admin: 2,
      super_admin: 3
    }

    return roleHierarchy[(data as any).role as AdminRole] >= roleHierarchy[requiredRole]
  } catch {
    return false
  }
}

/**
 * Get user's admin permissions
 */
export async function getAdminPermissions(
  userId: string
): Promise<AdminPermission | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as AdminPermission
  } catch {
    return null
  }
}

/**
 * Grant admin role to user
 */
export async function grantAdminRole(
  userId: string,
  role: AdminRole,
  grantedBy: string,
  permissions: Record<string, boolean> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('admin_permissions')
      .upsert({
        user_id: userId,
        role,
        permissions,
        granted_by: grantedBy
      } as any)

    if (error) throw error

    // Also update user_profiles
    await (supabase
      .from('user_profiles') as any)
      .update({ admin_role: role })
      .eq('id', userId)

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Revoke admin role from user
 */
export async function revokeAdminRole(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('admin_permissions')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    // Also update user_profiles
    await (supabase
      .from('user_profiles') as any)
      .update({ admin_role: null })
      .eq('id', userId)

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// -----------------------------------------------------------------------------
// ACTIVITY LOGGING
// ------------------------------------------------------------------------------

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get IP address (client-side only, will be null on server)
    let ipAddress = null
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        ipAddress = data.ip
      } catch {
        // Ignore error
      }
    }

    const { error } = await (supabase.rpc as any)('log_admin_activity', {
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      ip_address: ipAddress
    })

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    logger.error('Failed to log admin activity:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

/**
 * Get admin activity log
 */
export async function getAdminActivityLog(
  adminId?: string,
  limit = 50
): Promise<AdminActivity[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []) as AdminActivity[]
  } catch {
    return []
  }
}

// -----------------------------------------------------------------------------
// USER STATUS MANAGEMENT
// ------------------------------------------------------------------------------

/**
 * Update user account status
 */
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'banned',
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        account_status: status,
        status_updated_at: new Date().toISOString(),
        status_updated_by: updatedBy
      })
      .eq('id', userId)

    if (error) throw error

    // Log the action
    await logAdminActivity(
      updatedBy,
      `user_${status}`,
      'user',
      userId,
      { new_status: status }
    )

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// -----------------------------------------------------------------------------
// EVENT MODERATION
// ------------------------------------------------------------------------------

/**
 * Moderate event (approve/reject)
 */
export async function moderateEvent(
  eventId: string,
  action: 'approve' | 'reject',
  moderatorId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('events')
      .update({
        status: action === 'approve' ? 'published' : 'rejected',
        moderated_at: new Date().toISOString(),
        moderated_by: moderatorId,
        moderation_reason: reason
      })
      .eq('id', eventId)

    if (error) throw error

    // Log the action
    await logAdminActivity(
      moderatorId,
      `event_${action}`,
      'event',
      eventId,
      { reason }
    )

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// -----------------------------------------------------------------------------
// SYSTEM SETTINGS
// ------------------------------------------------------------------------------

/**
 * Get system setting value
 */
export async function getSystemSetting(key: string): Promise<any> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) return null

    return data.value
  } catch {
    return null
  }
}

/**
 * Update system setting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('system_settings')
      .update({ value, updated_by: updatedBy })
      .eq('key', key)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// -----------------------------------------------------------------------------
// PLATFORM STATISTICS
// ------------------------------------------------------------------------------

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<any> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_platform_stats')

    if (error) throw error

    return data
  } catch (error: unknown) {
    logger.error('Failed to get platform stats:', error)
    return null
  }
}

/**
 * Get revenue by month
 */
export async function getRevenueByMonth(months = 12): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('get_revenue_by_month', {
      months
    })

    if (error) throw error

    return data || []
  } catch {
    return []
  }
}

// -----------------------------------------------------------------------------
// EXPORT ALL UTILITIES
// ------------------------------------------------------------------------------

export const adminUtils = {
  isAdmin,
  hasAdminRole,
  getAdminPermissions,
  grantAdminRole,
  revokeAdminRole,
  logAdminActivity,
  getAdminActivityLog,
  updateUserStatus,
  moderateEvent,
  getSystemSetting,
  updateSystemSetting,
  getPlatformStats,
  getRevenueByMonth
}
