// =====================================================
// AFFILIATE TRACKING SYSTEM
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  linkId?: string;
  trackingCookie: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  landingPage?: string;
  converted: boolean;
  registrationId?: string;
  convertedAt?: string;
  cookieExpiresAt: string;
  createdAt: string;
}

export interface ReferralLink {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  linkType: 'general' | 'event' | 'category';
  targetEventId?: string;
  targetCategory?: string;
  shortCode: string;
  fullUrl: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

/**
 * Generate tracking cookie value
 */
export function generateTrackingCookie(): string {
  return Math.random().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(
  affiliateCode: string,
  context?: {
    linkId?: string;
    referrer?: string;
    userAgent?: string;
    landingPage?: string;
  }
): Promise<{ trackingCookie: string; affiliateCode: string } | null> {
  try {
    const supabase = await createServerClient();

    // Get affiliate account
    const { data: account, error: accountError } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (accountError || !account || account.status !== 'active') {
      return null;
    }

    // Generate tracking cookie
    const trackingCookie = generateTrackingCookie();
    const cookieExpiresAt = new Date();
    cookieExpiresAt.setDate(cookieExpiresAt.getDate() + 30); // 30-day cookie

    // Record click
    const { error: clickError } = await supabase.from('affiliate_clicks').insert({
      link_id: context?.linkId,
      affiliate_id: account.id,
      tracking_cookie: trackingCookie,
      referrer: context?.referrer,
      user_agent: context?.userAgent,
      landing_page: context?.landingPage,
      cookie_expires_at: cookieExpiresAt.toISOString(),
      converted: false,
    });

    if (clickError) {
      logger.error('Error recording click:', clickError);
    }

    // Update affiliate stats
    await supabase
      .from('affiliate_accounts')
      .update({
        total_clicks: (account.total_clicks || 0) + 1,
      })
      .eq('id', account.id);

    // Update link stats if link ID provided
    if (context?.linkId) {
      await supabase
        .from('affiliate_referral_links')
        .update({
          clicks: (supabase as any).raw('clicks + 1'),
        })
        .eq('id', context.linkId);
    }

    // Set cookie in browser (if in browser context)
    try {
      const cookieStore = await cookies();
      cookieStore.set('affiliate_tracking', trackingCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: cookieExpiresAt,
      });
    } catch {
      // Cookie setting might fail in server context
      // That's okay, caller will handle it
    }

    return {
      trackingCookie,
      affiliateCode,
    };
  } catch (error) {
    logger.error('Error tracking affiliate click:', error);
    return null;
  }
}

/**
 * Get affiliate code from cookie
 */
export async function getAffiliateFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const trackingCookie = cookieStore.get('affiliate_tracking')?.value;

    if (!trackingCookie) {
      return null;
    }

    const supabase = await createServerClient();

    // Get click record
    const { data: click } = await supabase
      .from('affiliate_clicks')
      .select('affiliate_id, cookie_expires_at')
      .eq('tracking_cookie', trackingCookie)
      .eq('converted', false)
      .single();

    if (!click) {
      return null;
    }

    // Check if cookie is still valid
    const now = new Date();
    const expiresAt = new Date(click.cookie_expires_at);

    if (now > expiresAt) {
      return null;
    }

    // Get affiliate code
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('affiliate_code')
      .eq('id', click.affiliate_id)
      .single();

    return account?.affiliate_code || null;
  } catch (error) {
    logger.error('Error getting affiliate from cookie:', error);
    return null;
  }
}

/**
 * Create referral link
 */
export async function createReferralLink(data: {
  affiliateId: string;
  linkType: 'general' | 'event' | 'category';
  targetEventId?: string;
  targetCategory?: string;
}): Promise<ReferralLink | null> {
  try {
    const supabase = await createServerClient();

    // Get affiliate code
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('affiliate_code')
      .eq('id', data.affiliateId)
      .single();

    if (!account) {
      return null;
    }

    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Build full URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fstivo.com';
    let fullUrl = baseUrl + '?ref=' + account.affiliate_code;

    if (data.linkType === 'event' && data.targetEventId) {
      fullUrl = baseUrl + '/events/' + data.targetEventId + '?ref=' + account.affiliate_code;
    } else if (data.linkType === 'category' && data.targetCategory) {
      fullUrl = baseUrl + '/events?category=' + data.targetCategory + '&ref=' + account.affiliate_code;
    }

    // Create link
    const { data: link, error } = await supabase
      .from('affiliate_referral_links')
      .insert({
        affiliate_id: data.affiliateId,
        link_type: data.linkType,
        target_event_id: data.targetEventId,
        target_category: data.targetCategory,
        short_code: shortCode,
        full_url: fullUrl,
        clicks: 0,
        conversions: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating referral link:', error);
      return null;
    }

    return {
      id: link.id,
      affiliateId: link.affiliate_id,
      affiliateCode: account.affiliate_code,
      linkType: link.link_type,
      targetEventId: link.target_event_id,
      targetCategory: link.target_category,
      shortCode: link.short_code,
      fullUrl: link.full_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      createdAt: link.created_at,
    };
  } catch (error) {
    logger.error('Error creating referral link:', error);
    return null;
  }
}

/**
 * Get referral links for affiliate
 */
export async function getReferralLinks(affiliateId: string): Promise<ReferralLink[]> {
  try {
    const supabase = await createServerClient();

    const { data: links, error } = await supabase
      .from('affiliate_referral_links')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting referral links:', error);
      return [];
    }

    // Get affiliate code
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('affiliate_code')
      .eq('id', affiliateId)
      .single();

    return (links || []).map((link: any) => ({
      id: link.id,
      affiliateId: link.affiliate_id,
      affiliateCode: account?.affiliate_code || '',
      linkType: link.link_type,
      targetEventId: link.target_event_id,
      targetCategory: link.target_category,
      shortCode: link.short_code,
      fullUrl: link.full_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      createdAt: link.created_at,
    }));
  } catch (error) {
    logger.error('Error getting referral links:', error);
    return [];
  }
}

/**
 * Delete referral link
 */
export async function deleteReferralLink(linkId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('affiliate_referral_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      logger.error('Error deleting referral link:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting referral link:', error);
    return false;
  }
}

/**
 * Get affiliate stats
 */
export async function getAffiliateStats(affiliateId: string): Promise<{
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarned: number;
  pendingPayout: number;
}> {
  try {
    const supabase = await createServerClient();

    const { data: account, error } = await supabase
      .from('affiliate_accounts')
      .select('*')
      .eq('id', affiliateId)
      .single();

    if (error || !account) {
      return {
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalEarned: 0,
        pendingPayout: 0,
      };
    }

    const conversionRate =
      account.total_clicks > 0
        ? (account.total_conversions / account.total_clicks) * 100
        : 0;

    return {
      totalClicks: account.total_clicks || 0,
      totalConversions: account.total_conversions || 0,
      conversionRate,
      totalEarned: account.total_earned || 0,
      pendingPayout: account.pending_payout || 0,
    };
  } catch (error) {
    logger.error('Error getting affiliate stats:', error);
    return {
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalEarned: 0,
      pendingPayout: 0,
    };
  }
}

/**
 * Get click details
 */
export async function getClickDetails(
  affiliateId: string,
  limit: number = 50
): Promise<AffiliateClick[]> {
  try {
    const supabase = await createServerClient();

    const { data: clicks, error } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error getting click details:', error);
      return [];
    }

    return (clicks || []).map((click: any) => ({
      id: click.id,
      affiliateId: click.affiliate_id,
      linkId: click.link_id,
      trackingCookie: click.tracking_cookie,
      referrer: click.referrer,
      userAgent: click.user_agent,
      ipAddress: click.ip_address,
      landingPage: click.landing_page,
      converted: click.converted,
      registrationId: click.registration_id,
      convertedAt: click.converted_at,
      cookieExpiresAt: click.cookie_expires_at,
      createdAt: click.created_at,
    }));
  } catch (error) {
    logger.error('Error getting click details:', error);
    return [];
  }
}

/**
 * Get top performing links
 */
export async function getTopPerformingLinks(
  affiliateId: string,
  limit: number = 5
): Promise<Array<{ linkId: string; fullUrl: string; clicks: number; conversions: number; ctr: number }>> {
  try {
    const supabase = await createServerClient();

    const { data: links, error } = await supabase
      .from('affiliate_referral_links')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('clicks', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (links || []).map((link: any) => ({
      linkId: link.id,
      fullUrl: link.full_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      ctr: link.clicks > 0 ? ((link.conversions || 0) / link.clicks) * 100 : 0,
    }));
  } catch (error) {
    logger.error('Error getting top performing links:', error);
    return [];
  }
}
