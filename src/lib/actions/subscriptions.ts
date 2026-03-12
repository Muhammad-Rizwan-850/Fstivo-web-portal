'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  plan_id: z.string().uuid(),
});

export async function subscribe(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = subscriptionSchema.parse(data);

  // Check for existing subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (existing) {
    return { error: 'Already have an active subscription' };
  }

  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', validated.plan_id)
    .single();

  if (!plan) {
    return { error: 'Plan not found' };
  }

  // Create subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: validated.plan_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/subscription');
  return { success: true, subscription };
}

export async function cancelSubscription() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/subscription');
  return { success: true };
}

export async function updateSubscription(planId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: planId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/subscription');
  return { success: true };
}
