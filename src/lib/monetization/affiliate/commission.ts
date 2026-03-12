// =====================================================
// AFFILIATE COMMISSION CALCULATION
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface Commission {
  id: string;
  affiliateId: string;
  registrationId: string;
  clickId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export interface CommissionTier {
  minConversions: number;
  maxConversions: number;
  commissionPercentage: number;
}

/**
 * Calculate commission for an order
 */
export async function calculateCommission(
  orderAmount: number,
  affiliateId: string
): Promise<number> {
  try {
    const supabase = await createServerClient();

    // Get commission config
    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config) {
      return 0;
    }

    // Get affiliate's total conversions to determine tier
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('total_conversions')
      .eq('id', affiliateId)
      .single();

    const totalConversions = account?.total_conversions || 0;

    // Get commission structure
    const commissionStructure = config.commission_structure as any;
    let commissionRate = config.commission_percentage; // Default rate

    // Check if using tiered commission
    if (commissionStructure.type === 'tiered' && commissionStructure.tiers) {
      const tier = findCommissionTier(commissionStructure.tiers, totalConversions);
      if (tier) {
        commissionRate = tier.commissionPercentage;
      }
    }

    // Calculate commission
    const commissionAmount = (orderAmount * commissionRate) / 100;

    return Math.round(commissionAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    logger.error('Error calculating commission:', error);
    return 0;
  }
}

/**
 * Find commission tier based on conversions
 */
function findCommissionTier(
  tiers: CommissionTier[],
  conversions: number
): CommissionTier | null {
  for (const tier of tiers) {
    if (
      conversions >= tier.minConversions &&
      (tier.maxConversions === -1 || conversions <= tier.maxConversions)
    ) {
      return tier;
    }
  }
  return null;
}

/**
 * Record affiliate conversion
 */
export async function recordConversion(
  registrationId: string,
  trackingCookie: string
): Promise<{ success: boolean; commissionAmount?: number }> {
  try {
    const supabase = await createServerClient();

    // Get click record
    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('tracking_cookie', trackingCookie)
      .eq('converted', false)
      .single();

    if (clickError || !click) {
      return { success: false };
    }

    // Check if cookie is still valid
    const now = new Date();
    const expiresAt = new Date(click.cookie_expires_at);

    if (now > expiresAt) {
      return { success: false };
    }

    // Get registration details
    const { data: registration } = await supabase
      .from('registrations')
      .select('total_amount')
      .eq('id', registrationId)
      .single();

    if (!registration) {
      return { success: false };
    }

    // Calculate commission
    const commissionAmount = await calculateCommission(
      registration.total_amount,
      click.affiliate_id
    );

    // Get commission rate
    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('commission_percentage')
      .eq('is_active', true)
      .single();

    const commissionRate = config?.commission_percentage || 10;

    // Create commission record
    const { error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: click.affiliate_id,
        registration_id: registrationId,
        click_id: click.id,
        order_amount: registration.total_amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
      });

    if (commissionError) {
      logger.error('Error creating commission:', commissionError);
      return { success: false };
    }

    // Update click as converted
    await supabase
      .from('affiliate_clicks')
      .update({
        converted: true,
        registration_id: registrationId,
        converted_at: new Date().toISOString(),
      })
      .eq('id', click.id);

    // Update affiliate stats
    await supabase
      .from('affiliate_accounts')
      .update({
        total_conversions: (supabase as any).raw('total_conversions + 1'),
        total_earned: (supabase as any).raw('total_earned + ' + commissionAmount),
        pending_payout: (supabase as any).raw('pending_payout + ' + commissionAmount),
      })
      .eq('id', click.affiliate_id);

    // Update referral link stats if applicable
    if (click.link_id) {
      await supabase
        .from('affiliate_referral_links')
        .update({
          conversions: (supabase as any).raw('conversions + 1'),
        })
        .eq('id', click.link_id);
    }

    return { success: true, commissionAmount };
  } catch (error) {
    logger.error('Error recording conversion:', error);
    return { success: false };
  }
}

/**
 * Get commissions for affiliate
 */
export async function getAffiliateCommissions(
  affiliateId: string,
  status?: Commission['status']
): Promise<Commission[]> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: commissions, error } = await query;

    if (error) {
      logger.error('Error getting commissions:', error);
      return [];
    }

    return (commissions || []).map((commission: any) => ({
      id: commission.id,
      affiliateId: commission.affiliate_id,
      registrationId: commission.registration_id,
      clickId: commission.click_id,
      orderAmount: commission.order_amount,
      commissionRate: commission.commission_rate,
      commissionAmount: commission.commission_amount,
      status: commission.status,
      createdAt: commission.created_at,
      approvedAt: commission.approved_at,
      paidAt: commission.paid_at,
    }));
  } catch (error) {
    logger.error('Error getting affiliate commissions:', error);
    return [];
  }
}

/**
 * Approve commission
 */
export async function approveCommission(commissionId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('affiliate_commissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', commissionId);

    if (error) {
      logger.error('Error approving commission:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error approving commission:', error);
    return false;
  }
}

/**
 * Reject commission
 */
export async function rejectCommission(
  commissionId: string,
  reason: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Get commission details
    const { data: commission } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('id', commissionId)
      .single();

    if (!commission) {
      return false;
    }

    // Update commission status
    const { error } = await supabase
      .from('affiliate_commissions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', commissionId);

    if (error) {
      logger.error('Error rejecting commission:', error);
      return false;
    }

    // Deduct from affiliate's pending payout
    await supabase
      .from('affiliate_accounts')
      .update({
        pending_payout: (supabase as any).raw('pending_payout - ' + commission.commission_amount),
      })
      .eq('id', commission.affiliate_id);

    return true;
  } catch (error) {
    logger.error('Error rejecting commission:', error);
    return false;
  }
}

/**
 * Get commission summary
 */
export async function getCommissionSummary(affiliateId: string) {
  try {
    const supabase = await createServerClient();

    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliateId);

    if (error) {
      return null;
    }

    const pending = commissions?.filter((c: any) => c.status === 'pending').length || 0;
    const approved = commissions?.filter((c: any) => c.status === 'approved').length || 0;
    const paid = commissions?.filter((c: any) => c.status === 'paid').length || 0;
    const rejected = commissions?.filter((c: any) => c.status === 'rejected').length || 0;

    const totalPending = commissions?.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.commission_amount, 0) || 0;
    const totalApproved = commissions?.filter((c: any) => c.status === 'approved').reduce((sum: number, c: any) => sum + c.commission_amount, 0) || 0;
    const totalPaid = commissions?.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + c.commission_amount, 0) || 0;

    return {
      totalCommissions: commissions?.length || 0,
      pending,
      approved,
      paid,
      rejected,
      totalPending,
      totalApproved,
      totalPaid,
      averageCommission: commissions?.length > 0
        ? commissions.reduce((sum: number, c: any) => sum + c.commission_amount, 0) / commissions.length
        : 0,
    };
  } catch (error) {
    logger.error('Error getting commission summary:', error);
    return null;
  }
}

/**
 * Get recent conversions with event details
 */
export async function getRecentConversions(
  affiliateId: string,
  limit: number = 10
): Promise<Array<{
  commissionId: string;
  eventName: string;
  orderAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}>> {
  try {
    const supabase = await createServerClient();

    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select(`
        *,
        registration:registrations(
          event:events(title)
        )
      `)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (commissions || []).map((commission: any) => ({
      commissionId: commission.id,
      eventName: commission.registration?.event?.title || 'Unknown Event',
      orderAmount: commission.order_amount,
      commissionAmount: commission.commission_amount,
      status: commission.status,
      createdAt: commission.created_at,
    }));
  } catch (error) {
    logger.error('Error getting recent conversions:', error);
    return [];
  }
}

/**
 * Get commission earnings over time
 */
export async function getCommissionEarningsOverTime(
  affiliateId: string,
  months: number = 12
): Promise<Array<{ month: string; earnings: number; conversions: number }>> {
  try {
    const supabase = await createServerClient();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    // Group by month
    const monthlyStats: Record<string, { earnings: number; conversions: number }> = {};

    for (const commission of commissions || []) {
      const date = new Date(commission.created_at);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { earnings: 0, conversions: 0 };
      }

      if (commission.status !== 'rejected') {
        monthlyStats[monthKey].earnings += commission.commission_amount;
        monthlyStats[monthKey].conversions++;
      }
    }

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      earnings: stats.earnings,
      conversions: stats.conversions,
    }));
  } catch (error) {
    logger.error('Error getting earnings over time:', error);
    return [];
  }
}
