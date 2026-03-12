// =====================================================
// AFFILIATE PROGRAM - SERVER ACTIONS
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export async function createAffiliateAccount(paymentDetails: {
  payment_method: string;
  payment_details: any;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const affiliateCode = 'AFF' + String(Date.now()).substring(8).toUpperCase() + Math.random().toString(36).substring(2, 4).toUpperCase();

    const { data: account, error } = await supabase
      .from('affiliate_accounts')
      .insert({
        user_id: user.id,
        affiliate_code: affiliateCode,
        ...paymentDetails,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/affiliate');
    return { account };
  } catch (error) {
    logger.error('Failed to create affiliate account', error as Error);
    return { error: 'Failed to create account' };
  }
}

export async function getAffiliateAccount() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: error.message };
    }

    return { account: data };
  } catch (error) {
    logger.error('Failed to get affiliate account', error as Error);
    return { error: 'Failed to fetch account' };
  }
}

export async function createAffiliateLink(data: {
  link_type: string;
  target_event_id?: string;
  target_category?: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!account || account.status !== 'active') {
      return { error: 'Affiliate account not active' };
    }

    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let fullUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    fullUrl += '?ref=' + account.affiliate_code;

    if (data.target_event_id) {
      fullUrl = process.env.NEXT_PUBLIC_SITE_URL + '/events/' + data.target_event_id + '?ref=' + account.affiliate_code;
    } else if (data.target_category) {
      fullUrl = process.env.NEXT_PUBLIC_SITE_URL + '/events?category=' + data.target_category + '&ref=' + account.affiliate_code;
    }

    const { data: link, error } = await supabase
      .from('affiliate_referral_links')
      .insert({
        affiliate_id: account.id,
        ...data,
        short_code: shortCode,
        full_url: fullUrl
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/affiliate/links');
    return { link };
  } catch (error) {
    logger.error('Failed to create affiliate link', error as Error);
    return { error: 'Failed to create link' };
  }
}

export async function trackAffiliateClick(affiliateCode: string, linkId?: string) {
  try {
    const supabase = await createServerClient();

    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (!account) return { error: 'Invalid affiliate code' };

    const trackingCookie = Math.random().toString(36) + Math.random().toString(36).substring(2);
    const cookieExpiresAt = new Date();
    cookieExpiresAt.setDate(cookieExpiresAt.getDate() + 30);

    await supabase.from('affiliate_clicks').insert({
      link_id: linkId,
      affiliate_id: account.id,
      tracking_cookie: trackingCookie,
      cookie_expires_at: cookieExpiresAt.toISOString()
    });

    await supabase
      .from('affiliate_accounts')
      .update({ total_clicks: account.total_clicks + 1 })
      .eq('id', account.id);

    return { trackingCookie, affiliateCode };
  } catch (error) {
    logger.error('Failed to track affiliate click', error as Error);
    return { error: 'Failed to track click' };
  }
}

export async function recordAffiliateConversion(
  registrationId: string,
  trackingCookie: string
) {
  try {
    const supabase = await createServerClient();

    const { data: click } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('tracking_cookie', trackingCookie)
      .eq('converted', false)
      .single();

    if (!click) return { success: false };

    const { data: registration } = await supabase
      .from('registrations')
      .select('total_amount')
      .eq('id', registrationId)
      .single();

    if (!registration) return { error: 'Registration not found' };

    const { data: commission_amount } = await supabase.rpc(
      'calculate_affiliate_commission',
      {
        p_order_amount: registration.total_amount,
        p_affiliate_id: click.affiliate_id
      }
    );

    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('commission_percentage')
      .eq('is_active', true)
      .single();

    await supabase.from('affiliate_commissions').insert({
      affiliate_id: click.affiliate_id,
      registration_id: registrationId,
      click_id: click.id,
      order_amount: registration.total_amount,
      commission_rate: config?.commission_percentage || 10,
      commission_amount: commission_amount || 0,
      status: 'pending'
    });

    await supabase
      .from('affiliate_clicks')
      .update({
        converted: true,
        registration_id: registrationId,
        converted_at: new Date().toISOString()
      })
      .eq('id', click.id);

    await (supabase as any)
      .from('affiliate_accounts')
      .update({
        total_conversions: (supabase as any).raw('total_conversions + 1'),
        total_earned: (supabase as any).raw('total_earned + ' + String(commission_amount || 0)),
        pending_payout: (supabase as any).raw('pending_payout + ' + String(commission_amount || 0))
      })
      .eq('id', click.affiliate_id);

    return { success: true };
  } catch (error) {
    logger.error('Failed to record affiliate conversion', error as Error);
    return { error: 'Failed to record conversion' };
  }
}

export async function getAffiliateStats() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!account) return { error: 'No affiliate account' };

    const [
      { data: commissions },
      { data: links },
      { data: recentConversions }
    ] = await Promise.all([
      supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', account.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_referral_links')
        .select('*')
        .eq('affiliate_id', account.id),
      supabase
        .from('affiliate_commissions')
        .select(`
          *,
          registration:registrations(
            event:events(title)
          )
        `)
        .eq('affiliate_id', account.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return {
      account,
      commissions,
      links,
      recentConversions
    };
  } catch (error) {
    logger.error('Failed to get affiliate stats', error as Error);
    return { error: 'Failed to fetch stats' };
  }
}

export async function getAffiliateLeaderboard() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('affiliate_leaderboard')
      .select('*')
      .limit(50);

    if (error) return { error: error.message };
    return { leaderboard: data };
  } catch (error) {
    logger.error('Failed to get affiliate leaderboard', error as Error);
    return { error: 'Failed to fetch leaderboard' };
  }
}

export async function requestAffiliatePayout() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!account) return { error: 'No affiliate account' };

    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('minimum_payout')
      .eq('is_active', true)
      .single();

    if (account.pending_payout < (config?.minimum_payout || 1000)) {
      return { error: 'Minimum payout is ' + String(config?.minimum_payout) + ' PKR' };
    }

    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('id')
      .eq('affiliate_id', account.id)
      .eq('status', 'approved');

    if (!commissions || commissions.length === 0) {
      return { error: 'No approved commissions to payout' };
    }

    const { data: payout, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: account.id,
        amount: account.pending_payout,
        commission_ids: commissions.map((c: any) => c.id),
        payment_method: account.payment_method,
        payment_details: account.payment_details,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/affiliate/payouts');
    return { payout };
  } catch (error) {
    logger.error('Failed to request affiliate payout', error as Error);
    return { error: 'Failed to request payout' };
  }
}

export async function getMarketingMaterials() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('affiliate_marketing_materials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { materials: data };
  } catch (error) {
    logger.error('Failed to get marketing materials', error as Error);
    return { error: 'Failed to fetch materials' };
  }
}

export async function getMyAffiliateLinks() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('affiliate_referral_links')
      .select('*')
      .eq('affiliate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { links: data };
  } catch (error) {
    logger.error('Failed to get affiliate links', error as Error);
    return { error: 'Failed to fetch links' };
  }
}
