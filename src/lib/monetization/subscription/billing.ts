// =====================================================
// SUBSCRIPTION BILLING LOGIC
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import type { SubscriptionPlan } from './plans';
import { logger } from '@/lib/logger';

export interface BillingInfo {
  userId: string;
  subscriptionId: string;
  tierId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  paymentMethod: string;
  paymentMethodDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  lineItems: InvoiceLineItem[];
  downloadUrl?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ProrationInfo {
  oldPlanAmount: number;
  newPlanAmount: number;
  proratedAmount: number;
  creditAmount: number;
  amountDue: number;
  daysRemainingInPeriod: number;
  totalDaysInPeriod: number;
}

/**
 * Get current billing information for user
 */
export async function getCurrentBilling(userId: string): Promise<BillingInfo | null> {
  try {
    const supabase = await createServerClient();

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return null;
    }

    // Calculate next billing date
    const periodEnd = new Date(subscription.current_period_end);
    const nextBillingDate = periodEnd;

    return {
      userId: subscription.user_id,
      subscriptionId: subscription.id,
      tierId: subscription.tier_id,
      billingCycle: subscription.billing_cycle,
      amount: subscription.amount,
      currency: 'PKR',
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      nextBillingDate: nextBillingDate.toISOString(),
      paymentMethod: subscription.payment_method,
    };
  } catch (error) {
    logger.error('Error getting current billing:', error);
    return null;
  }
}

/**
 * Calculate proration for plan changes
 */
export async function calculateProration(
  userId: string,
  newTierId: string,
  newBillingCycle: 'monthly' | 'yearly'
): Promise<ProrationInfo | null> {
  try {
    const supabase = await createServerClient();

    // Get current subscription
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSub) {
      return null;
    }

    // Get new tier pricing
    const { data: newTier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', newTierId)
      .single();

    if (!newTier) {
      return null;
    }

    const newAmount = newBillingCycle === 'monthly' ? newTier.price_monthly : newTier.price_yearly;
    const oldAmount = currentSub.amount;

    // Calculate time remaining
    const periodEnd = new Date(currentSub.current_period_end);
    const periodStart = new Date(currentSub.current_period_start);
    const now = new Date();
    const totalDaysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate prorated amounts
    const prorationRatio = daysRemaining / totalDaysInPeriod;
    const oldProratedAmount = oldAmount * prorationRatio;
    const newProratedAmount = newAmount * prorationRatio;

    // If upgrading, user pays difference. If downgrading, user gets credit.
    const amountDue = Math.max(0, newProratedAmount - oldProratedAmount);
    const creditAmount = Math.max(0, oldProratedAmount - newProratedAmount);

    return {
      oldPlanAmount: oldAmount,
      newPlanAmount: newAmount,
      proratedAmount: newProratedAmount,
      creditAmount,
      amountDue,
      daysRemainingInPeriod: daysRemaining,
      totalDaysInPeriod,
    };
  } catch (error) {
    logger.error('Error calculating proration:', error);
    return null;
  }
}

/**
 * Generate invoice for subscription
 */
export async function generateInvoice(
  subscriptionId: string,
  amount: number,
  description: string = 'Subscription fee'
): Promise<Invoice | null> {
  try {
    const supabase = await createServerClient();

    // Get subscription details
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      return null;
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('subscription_invoices')
      .insert({
        subscription_id: subscriptionId,
        user_id: subscription.user_id,
        invoice_number: invoiceNumber,
        amount,
        total_amount: amount,
        billing_period_start: subscription.current_period_start,
        billing_period_end: subscription.current_period_end,
        due_date: new Date().toISOString(),
        status: 'pending',
        line_items: [
          {
            description,
            quantity: 1,
            unit_price: amount,
            amount,
          },
        ],
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating invoice:', error);
      return null;
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      subscriptionId: invoice.subscription_id,
      userId: invoice.user_id,
      amount: invoice.amount,
      totalAmount: invoice.total_amount,
      currency: 'PKR',
      status: invoice.status,
      dueDate: invoice.due_date,
      billingPeriodStart: invoice.billing_period_start,
      billingPeriodEnd: invoice.billing_period_end,
      lineItems: invoice.line_items as InvoiceLineItem[],
    };
  } catch (error) {
    logger.error('Error generating invoice:', error);
    return null;
  }
}

/**
 * Get user's invoices
 */
export async function getUserInvoices(userId: string, limit = 12): Promise<Invoice[]> {
  try {
    const supabase = await createServerClient();

    const { data: invoices, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error getting invoices:', error);
      return [];
    }

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      subscriptionId: invoice.subscription_id,
      userId: invoice.user_id,
      amount: invoice.amount,
      totalAmount: invoice.total_amount,
      currency: 'PKR',
      status: invoice.status,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      billingPeriodStart: invoice.billing_period_start,
      billingPeriodEnd: invoice.billing_period_end,
      lineItems: invoice.line_items as InvoiceLineItem[],
    }));
  } catch (error) {
    logger.error('Error getting user invoices:', error);
    return [];
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string, userId: string): Promise<Invoice | null> {
  try {
    const supabase = await createServerClient();

    const { data: invoice, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (error || !invoice) {
      return null;
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      subscriptionId: invoice.subscription_id,
      userId: invoice.user_id,
      amount: invoice.amount,
      totalAmount: invoice.total_amount,
      currency: 'PKR',
      status: invoice.status,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      billingPeriodStart: invoice.billing_period_start,
      billingPeriodEnd: invoice.billing_period_end,
      lineItems: invoice.line_items as InvoiceLineItem[],
    };
  } catch (error) {
    logger.error('Error getting invoice:', error);
    return null;
  }
}

/**
 * Calculate upcoming invoice amount
 */
export async function calculateUpcomingInvoice(userId: string): Promise<number | null> {
  try {
    const billing = await getCurrentBilling(userId);

    if (!billing) {
      return null;
    }

    return billing.amount;
  } catch (error) {
    logger.error('Error calculating upcoming invoice:', error);
    return null;
  }
}

/**
 * Format amount for display
 */
export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get billing history summary
 */
export async function getBillingSummary(userId: string) {
  try {
    const supabase = await createServerClient();

    const [billingResult, invoicesResult] = await Promise.all([
      getCurrentBilling(userId),
      getUserInvoices(userId, 12),
    ]);

    const totalSpent = invoicesResult
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const pendingAmount = invoicesResult
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      currentBilling: billingResult,
      totalSpent,
      pendingAmount,
      invoiceCount: invoicesResult.length,
      paidInvoices: invoicesResult.filter((inv) => inv.status === 'paid').length,
      pendingInvoices: invoicesResult.filter((inv) => inv.status === 'pending').length,
    };
  } catch (error) {
    logger.error('Error getting billing summary:', error);
    return null;
  }
}

/**
 * Check if user has unpaid invoices
 */
export async function hasUnpaidInvoices(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1);

    if (error) return false;

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error checking unpaid invoices:', error);
    return false;
  }
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(
  invoiceId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        transaction_id: transactionId,
      })
      .eq('id', invoiceId);

    if (error) {
      logger.error('Error marking invoice as paid:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error marking invoice as paid:', error);
    return false;
  }
}
