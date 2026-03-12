'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const affiliateRegistrationSchema = z.object({
  payment_method: z.enum(['bank_transfer', 'jazzcash', 'easypaisa']),
  payment_details: z.object({
    account_title: z.string().min(1),
    account_number: z.string().min(1),
    bank_name: z.string().optional(),
  }),
  agree_to_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
});

export async function registerAffiliate(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = affiliateRegistrationSchema.parse(data);

  const affiliateCode = `AFF${user.id.substring(0, 8).toUpperCase()}`;

  const { error } = await supabase
    .from('affiliates')
    .insert({
      user_id: user.id,
      affiliate_code: affiliateCode,
      status: 'pending',
      payment_method: validated.payment_method,
      payment_details: validated.payment_details,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/affiliate');
  return { success: true, affiliateCode };
}

export async function createAffiliateLink(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!affiliate) {
    return { error: 'Not an active affiliate' };
  }

  const trackingCode = `${affiliate.affiliate_code}_${Date.now()}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const referralUrl = `${baseUrl}/events/${eventId}?ref=${trackingCode}`;

  const { error } = await supabase
    .from('affiliate_links')
    .insert({
      affiliate_id: affiliate.id,
      event_id: eventId,
      tracking_code: trackingCode,
      referral_url: referralUrl,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/affiliate/links');
  return { success: true, url: referralUrl };
}

export async function getAffiliateEarnings() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!affiliate) {
    return { error: 'Not an affiliate' };
  }

  const { data: commissions } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'paid');

  const totalEarnings = commissions?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

  return {
    success: true,
    earnings: {
      total: totalEarnings,
      pending: affiliate.pending_earnings || 0,
      paid: totalEarnings,
    },
  };
}

export async function requestPayout(amount: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!affiliate) {
    return { error: 'Not an affiliate' };
  }

  if ((affiliate.pending_earnings || 0) < amount) {
    return { error: 'Insufficient earnings' };
  }

  const { error } = await supabase
    .from('affiliate_payouts')
    .insert({
      affiliate_id: affiliate.id,
      amount,
      status: 'pending',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/affiliate/payouts');
  return { success: true };
}
