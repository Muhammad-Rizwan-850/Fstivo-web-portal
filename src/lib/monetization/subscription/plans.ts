// =====================================================
// SUBSCRIPTION PLANS CONFIGURATION
// =====================================================

export type SubscriptionTier = {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  max_events: number;
  max_attendees: number;
  created_at: string;
  updated_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface SubscriptionFeature {
  basic_analytics: boolean;
  custom_branding: boolean;
  advanced_analytics: boolean;
  email_marketing: boolean;
  event_templates: boolean;
  seating_management: boolean;
  api_access: boolean;
  white_label: boolean;
  priority_support: boolean;
  custom_domain: boolean;
}

export interface SubscriptionLimits {
  events_per_year: number; // -1 for unlimited
  attendees_per_event: number; // -1 for unlimited
  tickets_per_event: number; // -1 for unlimited
  email_campaigns_per_month: number; // -1 for unlimited
  templates_count: number; // -1 for unlimited
  team_members: number; // -1 for unlimited
  api_calls_per_month: number; // -1 for unlimited
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number; // in PKR
  priceYearly: number; // in PKR
  features: SubscriptionFeature;
  limits: SubscriptionLimits;
  displayOrder: number;
  isActive: boolean;
  popular?: boolean;
  badge?: string;
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // In production, this would fetch from the database
  // For now, return hardcoded plans that match the database migration
  return [
    {
      id: 'free-tier',
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for individuals and small events',
      priceMonthly: 0,
      priceYearly: 0,
      displayOrder: 1,
      isActive: true,
      features: {
        basic_analytics: true,
        custom_branding: false,
        advanced_analytics: false,
        email_marketing: false,
        event_templates: false,
        seating_management: false,
        api_access: false,
        white_label: false,
        priority_support: false,
        custom_domain: false,
      },
      limits: {
        events_per_year: 5,
        attendees_per_event: 100,
        tickets_per_event: 5,
        email_campaigns_per_month: 0,
        templates_count: 0,
        team_members: 1,
        api_calls_per_month: 0,
      },
    },
    {
      id: 'pro-tier',
      name: 'pro',
      displayName: 'Pro',
      description: 'For growing event organizers and small businesses',
      priceMonthly: 2900,
      priceYearly: 29000,
      displayOrder: 2,
      isActive: true,
      popular: true,
      badge: 'Most Popular',
      features: {
        basic_analytics: true,
        custom_branding: true,
        advanced_analytics: true,
        email_marketing: true,
        event_templates: true,
        seating_management: false,
        api_access: false,
        white_label: false,
        priority_support: false,
        custom_domain: false,
      },
      limits: {
        events_per_year: 50,
        attendees_per_event: 1000,
        tickets_per_event: 20,
        email_campaigns_per_month: 5,
        templates_count: 10,
        team_members: 5,
        api_calls_per_month: 1000,
      },
    },
    {
      id: 'business-tier',
      name: 'business',
      displayName: 'Business',
      description: 'For professional event organizers and agencies',
      priceMonthly: 9900,
      priceYearly: 99000,
      displayOrder: 3,
      isActive: true,
      features: {
        basic_analytics: true,
        custom_branding: true,
        advanced_analytics: true,
        email_marketing: true,
        event_templates: true,
        seating_management: true,
        api_access: true,
        white_label: false,
        priority_support: true,
        custom_domain: true,
      },
      limits: {
        events_per_year: -1, // unlimited
        attendees_per_event: 10000,
        tickets_per_event: -1, // unlimited
        email_campaigns_per_month: 25,
        templates_count: -1, // unlimited
        team_members: 20,
        api_calls_per_month: 10000,
      },
    },
    {
      id: 'enterprise-tier',
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'For large organizations with high-volume events',
      priceMonthly: 29900,
      priceYearly: 299000,
      displayOrder: 4,
      isActive: true,
      badge: 'Best Value',
      features: {
        basic_analytics: true,
        custom_branding: true,
        advanced_analytics: true,
        email_marketing: true,
        event_templates: true,
        seating_management: true,
        api_access: true,
        white_label: true,
        priority_support: true,
        custom_domain: true,
      },
      limits: {
        events_per_year: -1, // unlimited
        attendees_per_event: -1, // unlimited
        tickets_per_event: -1, // unlimited
        email_campaigns_per_month: -1, // unlimited
        templates_count: -1, // unlimited
        team_members: -1, // unlimited
        api_calls_per_month: -1, // unlimited
      },
    },
  ];
}

/**
 * Get a specific plan by name
 */
export async function getPlanByName(planName: string): Promise<SubscriptionPlan | undefined> {
  const plans = await getSubscriptionPlans();
  return plans.find((plan) => plan.name === planName);
}

/**
 * Get a specific plan by ID
 */
export async function getPlanById(planId: string): Promise<SubscriptionPlan | undefined> {
  const plans = await getSubscriptionPlans();
  return plans.find((plan) => plan.id === planId);
}

/**
 * Calculate yearly savings (17% discount = 10 months for 12)
 */
export function calculateYearlySavings(monthlyPrice: number): number {
  return monthlyPrice * 12 * 0.17;
}

/**
 * Get plan comparison data
 */
export async function getPlanComparison() {
  const plans = await getSubscriptionPlans();

  return {
    plans,
    features: [
      { key: 'basic_analytics', label: 'Basic Analytics' },
      { key: 'custom_branding', label: 'Custom Branding' },
      { key: 'advanced_analytics', label: 'Advanced Analytics' },
      { key: 'email_marketing', label: 'Email Marketing' },
      { key: 'event_templates', label: 'Event Templates' },
      { key: 'seating_management', label: 'Seating Management' },
      { key: 'api_access', label: 'API Access' },
      { key: 'white_label', label: 'White Label' },
      { key: 'priority_support', label: 'Priority Support' },
      { key: 'custom_domain', label: 'Custom Domain' },
    ],
    limits: [
      { key: 'events_per_year', label: 'Events per Year' },
      { key: 'attendees_per_event', label: 'Attendees per Event' },
      { key: 'tickets_per_event', label: 'Ticket Types per Event' },
      { key: 'email_campaigns_per_month', label: 'Email Campaigns/Month' },
      { key: 'templates_count', label: 'Saved Templates' },
      { key: 'team_members', label: 'Team Members' },
      { key: 'api_calls_per_month', label: 'API Calls/Month' },
    ],
  };
}

/**
 * Format limit value for display
 */
export function formatLimitValue(value: number): string {
  if (value === -1) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

/**
 * Get recommended plan based on usage
 */
export async function getRecommendedPlan(currentUsage: {
  eventsPerYear: number;
  attendeesPerEvent: number;
  needsEmailMarketing: boolean;
  needsSeating: boolean;
}): Promise<SubscriptionPlan> {
  const plans = await getSubscriptionPlans();

  // If they need enterprise features
  if (currentUsage.attendeesPerEvent > 10000 || currentUsage.eventsPerYear > 100) {
    return plans[3]; // Enterprise
  }

  // If they need business features
  if (
    currentUsage.needsSeating ||
    currentUsage.eventsPerYear > 50 ||
    currentUsage.attendeesPerEvent > 1000
  ) {
    return plans[2]; // Business
  }

  // If they need pro features
  if (
    currentUsage.needsEmailMarketing ||
    currentUsage.eventsPerYear > 5 ||
    currentUsage.attendeesPerEvent > 100
  ) {
    return plans[1]; // Pro
  }

  // Default to free
  return plans[0]; // Free
}
