// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    events: number;
    tickets_per_event: number;
    attendees_per_event: number;
  };
}

export interface SubscriptionUsage {
  subscription_id: string;
  period_start: string;
  period_end: string;
  events_created: number;
  tickets_sold: number;
  total_attendees: number;
  api_calls: number;
}

export interface Invoice {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  price_monthly?: number;
  price_yearly?: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  max_events: number;
  max_attendees: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureGate {
  id: string;
  feature_name: string;
  plan_id: string;
  is_enabled: boolean;
  limits?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  invoice_number: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  action: string;
  old_value?: any;
  new_value?: any;
  performed_by: string;
  created_at: string;
}
