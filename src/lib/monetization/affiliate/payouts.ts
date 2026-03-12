// =====================================================
// AFFILIATE PAYOUT MANAGEMENT
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  commissionIds: string[];
  paymentMethod: string;
  paymentDetails: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  transactionId?: string;
}

export interface PayoutRequest {
  affiliateId: string;
  amount: number;
  commissionIds: string[];
  paymentMethod: string;
  paymentDetails: any;
}

/**
 * Request payout
 */
export async function requestPayout(data: PayoutRequest): Promise<Payout | null> {
  try {
    const supabase = await createServerClient();

    // Get minimum payout config
    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('minimum_payout')
      .eq('is_active', true)
      .single();

    const minimumPayout = config?.minimum_payout || 1000;

    if (data.amount < minimumPayout) {
      throw new Error(`Minimum payout is PKR ${minimumPayout}`);
    }

    // Check if affiliate has enough pending balance
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('pending_payout')
      .eq('id', data.affiliateId)
      .single();

    if (!account || account.pending_payout < data.amount) {
      throw new Error('Insufficient pending balance');
    }

    // Verify all commissions belong to this affiliate and are approved
    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .in('id', data.commissionIds)
      .eq('affiliate_id', data.affiliateId)
      .eq('status', 'approved');

    if (!commissions || commissions.length !== data.commissionIds.length) {
      throw new Error('Invalid commissions');
    }

    // Create payout record
    const { data: payout, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: data.affiliateId,
        amount: data.amount,
        commission_ids: data.commissionIds,
        payment_method: data.paymentMethod,
        payment_details: data.paymentDetails,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating payout:', error);
      return null;
    }

    // Mark commissions as paid_out
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'paid_out',
        paid_at: new Date().toISOString(),
      })
      .in('id', data.commissionIds);

    // Reduce pending payout
    await supabase
      .from('affiliate_accounts')
      .update({
        pending_payout: (supabase as any).raw('pending_payout - ' + data.amount),
      })
      .eq('id', data.affiliateId);

    return {
      id: payout.id,
      affiliateId: payout.affiliate_id,
      amount: payout.amount,
      commissionIds: payout.commission_ids,
      paymentMethod: payout.payment_method,
      paymentDetails: payout.payment_details,
      status: payout.status,
      requestedAt: payout.requested_at,
      processedAt: payout.processed_at,
      completedAt: payout.completed_at,
      transactionId: payout.transaction_id,
    };
  } catch (error) {
    logger.error('Error requesting payout:', error);
    return null;
  }
}

/**
 * Get payouts for affiliate
 */
export async function getAffiliatePayouts(
  affiliateId: string,
  status?: Payout['status']
): Promise<Payout[]> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error } = await query;

    if (error) {
      logger.error('Error getting payouts:', error);
      return [];
    }

    return (payouts || []).map((payout: any) => ({
      id: payout.id,
      affiliateId: payout.affiliate_id,
      amount: payout.amount,
      commissionIds: payout.commission_ids,
      paymentMethod: payout.payment_method,
      paymentDetails: payout.payment_details,
      status: payout.status,
      requestedAt: payout.requested_at,
      processedAt: payout.processed_at,
      completedAt: payout.completed_at,
      failureReason: payout.failure_reason,
      transactionId: payout.transaction_id,
    }));
  } catch (error) {
    logger.error('Error getting affiliate payouts:', error);
    return [];
  }
}

/**
 * Process payout (admin action)
 */
export async function processPayout(
  payoutId: string,
  transactionId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('affiliate_payouts')
      .update({
        status: 'processing',
        processed_at: new Date().toISOString(),
        transaction_id: transactionId,
      })
      .eq('id', payoutId);

    if (error) {
      logger.error('Error processing payout:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error processing payout:', error);
    return false;
  }
}

/**
 * Complete payout (admin action)
 */
export async function completePayout(payoutId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Get payout details
    const { data: payout } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (!payout) {
      return false;
    }

    // Update payout status
    const { error } = await supabase
      .from('affiliate_payouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (error) {
      logger.error('Error completing payout:', error);
      return false;
    }

    // Mark commissions as paid
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .in('id', payout.commission_ids);

    return true;
  } catch (error) {
    logger.error('Error completing payout:', error);
    return false;
  }
}

/**
 * Fail payout (admin action)
 */
export async function failPayout(
  payoutId: string,
  reason: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Get payout details
    const { data: payout } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();

    if (!payout) {
      return false;
    }

    // Update payout status
    const { error } = await supabase
      .from('affiliate_payouts')
      .update({
        status: 'failed',
        failure_reason: reason,
      })
      .eq('id', payoutId);

    if (error) {
      logger.error('Error failing payout:', error);
      return false;
    }

    // Return commissions to approved status
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'approved',
        paid_at: null,
      })
      .in('id', payout.commission_ids);

    // Restore pending payout
    await supabase
      .from('affiliate_accounts')
      .update({
        pending_payout: (supabase as any).raw('pending_payout + ' + payout.amount),
      })
      .eq('id', payout.affiliate_id);

    return true;
  } catch (error) {
    logger.error('Error failing payout:', error);
    return false;
  }
}

/**
 * Get payout summary
 */
export async function getPayoutSummary(affiliateId: string) {
  try {
    const supabase = await createServerClient();

    const { data: payouts, error } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliateId);

    if (error) {
      return null;
    }

    const pending = payouts?.filter((p: any) => p.status === 'pending').length || 0;
    const processing = payouts?.filter((p: any) => p.status === 'processing').length || 0;
    const completed = payouts?.filter((p: any) => p.status === 'completed').length || 0;
    const failed = payouts?.filter((p: any) => p.status === 'failed').length || 0;

    const totalPaid = payouts?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const pendingAmount = payouts?.filter((p: any) => p.status === 'pending' || p.status === 'processing').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    return {
      totalPayouts: payouts?.length || 0,
      pending,
      processing,
      completed,
      failed,
      totalPaid,
      pendingAmount,
      lastPayoutDate: payouts && payouts.length > 0
        ? payouts[0].completed_at
        : null,
    };
  } catch (error) {
    logger.error('Error getting payout summary:', error);
    return null;
  }
}

/**
 * Check if affiliate can request payout
 */
export async function canRequestPayout(affiliateId: string): Promise<{
  canRequest: boolean;
  reason?: string;
  availableAmount?: number;
  minimumPayout?: number;
}> {
  try {
    const supabase = await createServerClient();

    // Get affiliate account
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('pending_payout, status')
      .eq('id', affiliateId)
      .single();

    if (!account || account.status !== 'active') {
      return { canRequest: false, reason: 'Affiliate account is not active' };
    }

    // Get minimum payout config
    const { data: config } = await supabase
      .from('affiliate_program_config')
      .select('minimum_payout')
      .eq('is_active', true)
      .single();

    const minimumPayout = config?.minimum_payout || 1000;
    const availableAmount = account.pending_payout || 0;

    if (availableAmount < minimumPayout) {
      return {
        canRequest: false,
        reason: `Minimum payout is PKR ${minimumPayout}. You have PKR ${availableAmount} available.`,
        availableAmount,
        minimumPayout,
      };
    }

    return {
      canRequest: true,
      availableAmount,
      minimumPayout,
    };
  } catch (error) {
    logger.error('Error checking if can request payout:', error);
    return { canRequest: false, reason: 'Unable to verify payout eligibility' };
  }
}

/**
 * Get all pending payouts (admin)
 */
export async function getPendingPayouts(): Promise<Payout[]> {
  try {
    const supabase = await createServerClient();

    const { data: payouts, error } = await supabase
      .from('affiliate_payouts')
      .select(`
        *,
        affiliate:affiliate_accounts(*),
        user:profiles(*)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      return [];
    }

    return (payouts || []).map((payout: any) => ({
      id: payout.id,
      affiliateId: payout.affiliate_id,
      amount: payout.amount,
      commissionIds: payout.commission_ids,
      paymentMethod: payout.payment_method,
      paymentDetails: payout.payment_details,
      status: payout.status,
      requestedAt: payout.requested_at,
    }));
  } catch (error) {
    logger.error('Error getting pending payouts:', error);
    return [];
  }
}

/**
 * Export payout report
 */
export async function exportPayoutReport(
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('affiliate_payouts')
      .select(`
        *,
        affiliate:affiliate_accounts(*),
        user:profiles(*)
      `)
      .order('requested_at', { ascending: false });

    if (startDate) {
      query = query.gte('requested_at', startDate);
    }

    if (endDate) {
      query = query.lte('requested_at', endDate);
    }

    const { data: payouts, error } = await query;

    if (error) {
      return null;
    }

    return {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      payouts: (payouts || []).map((payout: any) => ({
        payoutId: payout.id,
        affiliateName: payout.user?.full_name || 'N/A',
        affiliateEmail: payout.user?.email || 'N/A',
        affiliateCode: payout.affiliate?.affiliate_code || 'N/A',
        amount: payout.amount,
        paymentMethod: payout.payment_method,
        status: payout.status,
        requestedAt: payout.requested_at,
        completedAt: payout.completed_at,
      })),
    };
  } catch (error) {
    logger.error('Error exporting payout report:', error);
    return null;
  }
}

/**
 * Calculate total payouts needed
 */
export async function calculateTotalPendingPayouts(): Promise<number> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('affiliate_payouts')
      .select('amount')
      .eq('status', 'pending');

    if (error) {
      return 0;
    }

    return (data || []).reduce((sum: number, p: any) => sum + p.amount, 0);
  } catch (error) {
    logger.error('Error calculating total pending payouts:', error);
    return 0;
  }
}
