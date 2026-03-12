// =====================================================
// SUBSCRIPTION USAGE TRACKING
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import type { SubscriptionPlan } from './plans';
import { logger } from '@/lib/logger';

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  resourceType: string;
  quantity: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  resourceType: string;
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
  isUnlimited: boolean;
  willExceedSoon: boolean;
  resetDate: string;
}

export interface UsageAlert {
  resourceType: string;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
  severity: 'warning' | 'critical' | 'exceeded';
  message: string;
}

/**
 * Track usage of a resource
 */
export async function trackUsage(
  userId: string,
  resourceType: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      logger.warn('No active subscription found for user:', userId);
      return false;
    }

    // Check if usage record exists for this period
    const { data: existingUsage } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('resource_type', resourceType)
      .gte('period_start', subscription.current_period_start)
      .lte('period_end', subscription.current_period_end)
      .single();

    if (existingUsage) {
      // Update existing record
      const { error } = await supabase
        .from('subscription_usage')
        .update({
          quantity: existingUsage.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUsage.id);

      if (error) {
        logger.error('Error updating usage:', error);
        return false;
      }
    } else {
      // Create new usage record
      const { error } = await supabase.from('subscription_usage').insert({
        subscription_id: subscription.id,
        user_id: userId,
        resource_type: resourceType,
        quantity,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
      });

      if (error) {
        logger.error('Error creating usage record:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error tracking usage:', error);
    return false;
  }
}

/**
 * Get current usage for a resource
 */
export async function getUsage(
  userId: string,
  resourceType: string
): Promise<UsageStats | null> {
  try {
    const supabase = await createServerClient();

    // Get subscription and tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || !subscription.tier) {
      return null;
    }

    // Get limit from tier
    const limits = subscription.tier.limits as Record<string, number>;
    const limit = limits[resourceType] ?? 0;

    // Get current usage
    const { data: usage } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('resource_type', resourceType)
      .gte('period_start', subscription.current_period_start)
      .lte('period_end', subscription.current_period_end)
      .single();

    const used = usage?.quantity || 0;
    const isUnlimited = limit === -1;
    const remaining = isUnlimited ? -1 : Math.max(0, limit - used);
    const percentageUsed = isUnlimited ? 0 : (used / limit) * 100;
    const willExceedSoon = !isUnlimited && percentageUsed >= 80;

    return {
      resourceType,
      used,
      limit,
      remaining,
      percentageUsed,
      isUnlimited,
      willExceedSoon,
      resetDate: subscription.current_period_end,
    };
  } catch (error) {
    logger.error('Error getting usage:', error);
    return null;
  }
}

/**
 * Get all usage stats for user
 */
export async function getAllUsageStats(userId: string): Promise<UsageStats[]> {
  try {
    const supabase = await createServerClient();

    // Get subscription and tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || !subscription.tier) {
      return [];
    }

    // Get all limits
    const limits = subscription.tier.limits as Record<string, number>;
    const resourceTypes = Object.keys(limits);

    const stats: UsageStats[] = [];

    for (const resourceType of resourceTypes) {
      const usage = await getUsage(userId, resourceType);
      if (usage) {
        stats.push(usage);
      }
    }

    return stats;
  } catch (error) {
    logger.error('Error getting all usage stats:', error);
    return [];
  }
}

/**
 * Check if user can use a resource
 */
export async function canUseResource(
  userId: string,
  resourceType: string,
  quantity: number = 1
): Promise<{ canUse: boolean; reason?: string }> {
  try {
    const supabase = await createServerClient();

    // Call the database function
    const { data, error } = await supabase.rpc('check_subscription_limit', {
      p_user_id: userId,
      p_resource_type: resourceType,
      p_quantity: quantity,
    });

    if (error) {
      logger.error('Error checking subscription limit:', error);
      return { canUse: false, reason: 'Unable to verify subscription limits' };
    }

    if (!data) {
      const usage = await getUsage(userId, resourceType);
      if (usage && !usage.isUnlimited && usage.remaining < quantity) {
        return {
          canUse: false,
          reason: `You have reached your limit for ${formatResourceName(resourceType)}. Upgrade your plan to continue.`,
        };
      }
    }

    return { canUse: true };
  } catch (error) {
    logger.error('Error checking if user can use resource:', error);
    return { canUse: false, reason: 'Unable to verify access' };
  }
}

/**
 * Get usage alerts for user
 */
export async function getUsageAlerts(userId: string): Promise<UsageAlert[]> {
  try {
    const stats = await getAllUsageStats(userId);
    const alerts: UsageAlert[] = [];

    for (const stat of stats) {
      if (stat.isUnlimited) continue;

      if (stat.percentageUsed >= 100) {
        alerts.push({
          resourceType: stat.resourceType,
          currentUsage: stat.used,
          limit: stat.limit,
          percentageUsed: stat.percentageUsed,
          severity: 'exceeded',
          message: `You have exceeded your ${formatResourceName(stat.resourceType)} limit (${stat.used}/${stat.limit}). Please upgrade your plan.`,
        });
      } else if (stat.percentageUsed >= 90) {
        alerts.push({
          resourceType: stat.resourceType,
          currentUsage: stat.used,
          limit: stat.limit,
          percentageUsed: stat.percentageUsed,
          severity: 'critical',
          message: `You have used ${stat.percentageUsed.toFixed(0)}% of your ${formatResourceName(stat.resourceType)} limit. Consider upgrading soon.`,
        });
      } else if (stat.percentageUsed >= 80) {
        alerts.push({
          resourceType: stat.resourceType,
          currentUsage: stat.used,
          limit: stat.limit,
          percentageUsed: stat.percentageUsed,
          severity: 'warning',
          message: `You have used ${stat.percentageUsed.toFixed(0)}% of your ${formatResourceName(stat.resourceType)} limit.`,
        });
      }
    }

    return alerts;
  } catch (error) {
    logger.error('Error getting usage alerts:', error);
    return [];
  }
}

/**
 * Reset usage (called when billing period resets)
 */
export async function resetUsage(subscriptionId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Archive old usage records
    const { error: archiveError } = await supabase
      .from('subscription_usage_history')
      .insert(
        supabase
          .from('subscription_usage')
          .select('*')
          .eq('subscription_id', subscriptionId)
      );

    if (archiveError) {
      logger.error('Error archiving usage records:', archiveError);
    }

    // Delete current period usage
    const { error: deleteError } = await supabase
      .from('subscription_usage')
      .delete()
      .eq('subscription_id', subscriptionId);

    if (deleteError) {
      logger.error('Error resetting usage:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error resetting usage:', error);
    return false;
  }
}

/**
 * Get usage history
 */
export async function getUsageHistory(
  userId: string,
  resourceType?: string,
  months: number = 6
): Promise<UsageRecord[]> {
  try {
    const supabase = await createServerClient();

    const query = supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(months * 31); // Approximate

    if (resourceType) {
      query.eq('resource_type', resourceType);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error getting usage history:', error);
      return [];
    }

    return data as UsageRecord[];
  } catch (error) {
    logger.error('Error getting usage history:', error);
    return [];
  }
}

/**
 * Format resource type for display
 */
function formatResourceName(resourceType: string): string {
  const names: Record<string, string> = {
    events_per_year: 'events',
    attendees_per_event: 'attendees per event',
    tickets_per_event: 'ticket types',
    email_campaigns_per_month: 'email campaigns',
    templates_count: 'templates',
    team_members: 'team members',
    api_calls_per_month: 'API calls',
  };

  return names[resourceType] || resourceType.replace(/_/g, ' ');
}

/**
 * Check if user is approaching limits
 */
export async function isApproachingLimits(userId: string): Promise<boolean> {
  const alerts = await getUsageAlerts(userId);
  return alerts.length > 0;
}

/**
 * Get usage summary for dashboard
 */
export async function getUsageSummary(userId: string) {
  const stats = await getAllUsageStats(userId);
  const alerts = await getUsageAlerts(userId);

  // Calculate overall usage percentage
  const limitedStats = stats.filter((s) => !s.isUnlimited);
  const avgPercentageUsed =
    limitedStats.length > 0
      ? limitedStats.reduce((sum, s) => sum + s.percentageUsed, 0) / limitedStats.length
      : 0;

  return {
    stats,
    alerts,
    overallUsagePercentage: avgPercentageUsed,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical' || a.severity === 'exceeded').length,
    warningAlerts: alerts.filter((a) => a.severity === 'warning').length,
  };
}
