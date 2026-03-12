// =====================================================
// SUBSCRIPTION FEATURE GATING
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import type { SubscriptionFeature } from './plans';
import { getPlanById } from './plans';
import { logger } from '@/lib/logger';

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  currentPlan?: string;
  requiredPlan?: string;
  upgradeUrl?: string;
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: keyof SubscriptionFeature
): Promise<FeatureAccessResult> {
  try {
    const supabase = await createServerClient();

    // Get user's subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      // No active subscription - check if it's a free tier feature
      const freePlan = await getPlanById('free-tier');
      const hasFreeAccess = freePlan?.features[featureName] || false;

      if (!hasFreeAccess) {
        return {
          hasAccess: false,
          reason: 'This feature requires a paid subscription',
          currentPlan: 'free',
          requiredPlan: 'pro',
          upgradeUrl: '/dashboard/subscription/plans',
        };
      }

      return {
        hasAccess: true,
        currentPlan: 'free',
      };
    }

    // Check if the tier has this feature
    const tierFeatures = subscription.tier?.features as SubscriptionFeature;
    const hasAccess = tierFeatures?.[featureName] || false;

    if (!hasAccess) {
      // Find which tier has this feature
      const plans = await import('./plans').then((m) => m.getSubscriptionPlans());
      const allPlans = await plans;
      const planWithFeature = allPlans.find((plan) => plan.features[featureName]);

      return {
        hasAccess: false,
        reason: `'${formatFeatureName(featureName)}' is not available in your current plan`,
        currentPlan: subscription.tier?.name || 'unknown',
        requiredPlan: planWithFeature?.name,
        upgradeUrl: '/dashboard/subscription/plans',
      };
    }

    return {
      hasAccess: true,
      currentPlan: subscription.tier?.name || 'unknown',
    };
  } catch (error) {
    logger.error('Error checking feature access:', error);
    return {
      hasAccess: false,
      reason: 'Unable to verify feature access',
    };
  }
}

/**
 * Check multiple features at once
 */
export async function checkMultipleFeatures(
  userId: string,
  featureNames: (keyof SubscriptionFeature)[]
): Promise<Record<string, FeatureAccessResult>> {
  const results: Record<string, FeatureAccessResult> = {};

  for (const featureName of featureNames) {
    results[featureName] = await checkFeatureAccess(userId, featureName);
  }

  return results;
}

/**
 * Get all available features for user's plan
 */
export async function getUserFeatures(userId: string): Promise<SubscriptionFeature | null> {
  try {
    const supabase = await createServerClient();

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier:subscription_tiers(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription?.tier) {
      // Return free tier features
      const freePlan = await getPlanById('free-tier');
      return freePlan?.features || null;
    }

    return (subscription.tier as any)?.features as SubscriptionFeature;
  } catch (error) {
    logger.error('Error getting user features:', error);
    return null;
  }
}

/**
 * Require feature access (throws error if no access)
 */
export async function requireFeatureAccess(
  userId: string,
  featureName: keyof SubscriptionFeature
): Promise<void> {
  const result = await checkFeatureAccess(userId, featureName);

  if (!result.hasAccess) {
    throw new Error(result.reason || 'Feature access denied');
  }
}

/**
 * Check if user can access feature (client-side helper)
 * This is a lighter version that uses cached subscription data
 */
export function canAccessFeature(
  userFeatures: SubscriptionFeature | null,
  featureName: keyof SubscriptionFeature
): boolean {
  if (!userFeatures) return false;
  return userFeatures[featureName] === true;
}

/**
 * Get feature metadata for UI display
 */
export function getFeatureMetadata(featureName: keyof SubscriptionFeature) {
  const metadata: Record<keyof SubscriptionFeature, { name: string; description: string; category: string }> = {
    basic_analytics: {
      name: 'Basic Analytics',
      description: 'View event attendance, revenue, and basic performance metrics',
      category: 'Analytics',
    },
    custom_branding: {
      name: 'Custom Branding',
      description: 'Add your logo, colors, and custom branding to event pages',
      category: 'Branding',
    },
    advanced_analytics: {
      name: 'Advanced Analytics',
      description: 'Deep insights into attendee behavior, marketing ROI, and trends',
      category: 'Analytics',
    },
    email_marketing: {
      name: 'Email Marketing',
      description: 'Create and send email campaigns to your attendees',
      category: 'Marketing',
    },
    event_templates: {
      name: 'Event Templates',
      description: 'Save events as templates and reuse them for future events',
      category: 'Efficiency',
    },
    seating_management: {
      name: 'Seating Management',
      description: 'Create seating charts and manage seat reservations',
      category: 'Operations',
    },
    api_access: {
      name: 'API Access',
      description: 'Integrate FSTIVO with your existing systems via API',
      category: 'Integration',
    },
    white_label: {
      name: 'White Label',
      description: 'Remove FSTIVO branding and use your own domain',
      category: 'Branding',
    },
    priority_support: {
      name: 'Priority Support',
      description: 'Get faster response times and dedicated support',
      category: 'Support',
    },
    custom_domain: {
      name: 'Custom Domain',
      description: 'Use your own domain for event pages',
      category: 'Branding',
    },
  };

  return metadata[featureName];
}

/**
 * Format feature name for display
 */
function formatFeatureName(featureName: string): string {
  return featureName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get features by category
 */
export async function getFeaturesByCategory(category: string): Promise<(keyof SubscriptionFeature)[]> {
  const plans = await import('./plans').then((m) => m.getSubscriptionPlans());
  const allPlans = await plans;
  const businessPlan = allPlans.find((p) => p.name === 'business');

  if (!businessPlan) return [];

  return Object.entries(businessPlan.features)
    .filter(([_, value]) => value === true)
    .map(([key]) => {
      const metadata = getFeatureMetadata(key as keyof SubscriptionFeature);
      return metadata.category === category ? (key as keyof SubscriptionFeature) : null;
    })
    .filter((item): item is keyof SubscriptionFeature => item !== null) as (keyof SubscriptionFeature)[];
}

/**
 * Check if upgrade is needed for feature
 */
export function needsUpgrade(result: FeatureAccessResult): boolean {
  return !result.hasAccess && !!result.upgradeUrl;
}

/**
 * Middleware helper to protect routes by feature
 */
export function createFeatureGuard(featureName: keyof SubscriptionFeature) {
  return async (userId: string) => {
    const result = await checkFeatureAccess(userId, featureName);

    if (!result.hasAccess) {
      return {
        allowed: false,
        redirectTo: result.upgradeUrl,
        message: result.reason,
      };
    }

    return {
      allowed: true,
    };
  };
}
