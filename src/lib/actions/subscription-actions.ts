// =====================================================
// SUBSCRIPTION MANAGEMENT - SERVER ACTIONS
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export async function getSubscriptionTiers() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) return { error: error.message };
    return { tiers: data };
  } catch (error) {
    logger.error('Failed to get subscription tiers', error as Error);
    return { error: 'Failed to fetch tiers' };
  }
}

export async function getCurrentSubscription() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: error.message };
    }

    return { subscription: data };
  } catch (error) {
    logger.error('Failed to get current subscription', error as Error);
    return { error: 'Failed to fetch subscription' };
  }
}

export async function createSubscription(
  tierId: string,
  billingCycle: 'monthly' | 'yearly',
  paymentMethod: string
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (!tier) return { error: 'Invalid tier' };

    const amount = billingCycle === 'monthly' 
      ? tier.price_monthly 
      : tier.price_yearly;

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        tier_id: tierId,
        billing_cycle: billingCycle,
        amount,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: paymentMethod,
        status: 'active'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    await createSubscriptionInvoice(subscription.id, amount);

    await supabase.from('subscription_history').insert({
      user_id: user.id,
      subscription_id: subscription.id,
      action: 'created',
      to_tier_id: tierId
    });

    revalidatePath('/dashboard/subscription');
    return { subscription };
  } catch (error) {
    logger.error('Failed to create subscription', error as Error);
    return { error: 'Failed to create subscription' };
  }
}

export async function upgradeSubscription(newTierId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentSub) return { error: 'No active subscription' };

    const { data: newTier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', newTierId)
      .single();

    if (!newTier) return { error: 'Invalid tier' };

    const newAmount = currentSub.billing_cycle === 'monthly' 
      ? newTier.price_monthly 
      : newTier.price_yearly;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier_id: newTierId,
        amount: newAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSub.id);

    if (error) return { error: error.message };

    await supabase.from('subscription_history').insert({
      user_id: user.id,
      subscription_id: currentSub.id,
      action: 'upgraded',
      from_tier_id: currentSub.tier_id,
      to_tier_id: newTierId
    });

    revalidatePath('/dashboard/subscription');
    return { success: true };
  } catch (error) {
    logger.error('Failed to upgrade subscription', error as Error);
    return { error: 'Failed to upgrade subscription' };
  }
}

export async function cancelSubscription(reason?: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) return { error: 'No active subscription' };

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (error) return { error: error.message };

    await supabase.from('subscription_history').insert({
      user_id: user.id,
      subscription_id: subscription.id,
      action: 'cancelled',
      reason
    });

    revalidatePath('/dashboard/subscription');
    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel subscription', error as Error);
    return { error: 'Failed to cancel subscription' };
  }
}

export async function checkFeatureAccess(featureName: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { hasAccess: false };

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, tier:subscription_tiers(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) return { hasAccess: false };

    const hasAccess = subscription.tier.features[featureName] === true;
    return { hasAccess };
  } catch (error) {
    logger.error('Failed to check feature access', error as Error);
    return { hasAccess: false };
  }
}

export async function getSubscriptionInvoices() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { invoices: data };
  } catch (error) {
    logger.error('Failed to get invoices', error as Error);
    return { error: 'Failed to fetch invoices' };
  }
}

async function createSubscriptionInvoice(subscriptionId: string, amount: number) {
  const supabase = await createServerClient();

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (!subscription) return;

  const invoiceNumber = 'INV-' + String(Date.now()) + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  await supabase.from('subscription_invoices').insert({
    subscription_id: subscriptionId,
    user_id: subscription.user_id,
    invoice_number: invoiceNumber,
    amount,
    total_amount: amount,
    billing_period_start: subscription.current_period_start,
    billing_period_end: subscription.current_period_end,
    due_date: new Date().toISOString(),
    status: 'pending',
    line_items: [{
      description: 'Subscription fee',
      amount
    }]
  });
}
