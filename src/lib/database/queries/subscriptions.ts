/**
 * Subscription Query Functions
 * Database queries for subscription management and billing
 */

import { createClient } from '@/lib/auth/config'
import type {
  SubscriptionTier,
  UserSubscription,
  SubscriptionUsage,
  FeatureGate,
  SubscriptionInvoice
} from '@/types/subscription'

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export async function getSubscriptionTiers() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('subscription_tiers') as any)
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) throw error
  return data as SubscriptionTier[]
}

export async function getSubscriptionTier(tierId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('subscription_tiers') as any)
    .select('*')
    .eq('id', tierId)
    .single()

  if (error) throw error
  return data as SubscriptionTier
}

export async function getSubscriptionTierByName(name: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('subscription_tiers') as any)
    .select('*')
    .eq('name', name)
    .single()

  if (error) throw error
  return data as SubscriptionTier
}

// ============================================================================
// USER SUBSCRIPTIONS
// ============================================================================

export async function getUserSubscription(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      tier:subscription_tiers(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as UserSubscription | null
}

export async function createUserSubscription(
  userId: string,
  tierId: string,
  subscriptionData: {
    billingCycle: 'monthly' | 'yearly' | 'lifetime'
    amount: number
    paymentMethod?: string
    stripeSubscriptionId?: string
    stripeCustomerId?: string
  }
) {
  const supabase = await createClient()

  // Calculate period dates
  const periodStart = new Date()
  const periodEnd = new Date(periodStart)

  if (subscriptionData.billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (subscriptionData.billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    // Lifetime - 100 years in future
    periodEnd.setFullYear(periodEnd.getFullYear() + 100)
  }

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .insert({
      user_id: userId,
      tier_id: tierId,
      billing_cycle: subscriptionData.billingCycle,
      amount: subscriptionData.amount,
      payment_method: subscriptionData.paymentMethod,
      stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      stripe_customer_id: subscriptionData.stripeCustomerId,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error
  return data as UserSubscription
}

export async function updateUserSubscription(
  subscriptionId: string,
  updates: Partial<UserSubscription>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) throw error
  return data as UserSubscription
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
) {
  const supabase = await createClient()

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (cancelAtPeriodEnd) {
    // Just mark as cancelled, keep active until period end
    updateData.status = 'cancelled'
    updateData.cancelled_at = new Date().toISOString()
  } else {
    // Cancel immediately
    updateData.status = 'expired'
  }

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .update(updateData)
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) throw error
  return data as UserSubscription
}

export async function upgradeSubscription(
  subscriptionId: string,
  newTierId: string
) {
  const supabase = await createClient()

  // Get current subscription
  const current = await (supabase
    .from('user_subscriptions') as any)
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (current.error) throw current.error

  // Get new tier
  const newTier = await getSubscriptionTier(newTierId)

  // Calculate new amount based on billing cycle
  const newAmount = current.data.billing_cycle === 'monthly'
    ? newTier.price_monthly
    : newTier.price_yearly

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      tier_id: newTierId,
      amount: newAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) throw error

  // Record history
  await recordSubscriptionHistory(
    current.data.user_id,
    subscriptionId,
    'upgraded',
    current.data.tier_id,
    newTierId
  )

  return data as UserSubscription
}

export async function checkSubscriptionLimits(userId: string) {
  const supabase = await createClient()

  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('*, tier:subscription_tiers(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    return {
      hasSubscription: false,
      limits: null
    }
  }

  const tier = subscription.tier as any
  const limits = tier.limits

  // Get current usage
  const { data: usage } = await (supabase
    .from('subscription_usage') as any)
    .select('resource_type, quantity')
    .eq('subscription_id', subscription.id)
    .gte('period_start', subscription.current_period_start)
    .lte('period_end', subscription.current_period_end)

  // Calculate usage by resource type
  const currentUsage: Record<string, number> = {}
  usage?.forEach((u: any) => {
    currentUsage[u.resource_type] = (currentUsage[u.resource_type] || 0) + u.quantity
  })

  return {
    hasSubscription: true,
    tier: tier.name,
    limits,
    currentUsage,
    canCreateEvent: checkLimit(limits, currentUsage, 'events_per_year'),
    canSendEmail: checkLimit(limits, currentUsage, 'email_campaigns'),
    canAddTeam: checkLimit(limits, currentUsage, 'team_members')
  }
}

function checkLimit(
  limits: Record<string, any>,
  currentUsage: Record<string, number>,
  resourceKey: string
): boolean {
  const limit = limits[resourceKey]
  if (limit === -1) return true // Unlimited
  if (limit === null || limit === undefined) return true // No limit set
  return (currentUsage[resourceKey] || 0) < limit
}

// ============================================================================
// SUBSCRIPTION USAGE
// ============================================================================

export async function recordUsage(
  subscriptionId: string,
  resourceType: string,
  quantity = 1
) {
  const supabase = await createClient()

  // Get subscription period
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('current_period_start, current_period_end')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) throw new Error('Subscription not found')

  const { data, error } = await (supabase
    .from('subscription_usage') as any)
    .insert({
      subscription_id: subscriptionId,
      resource_type: resourceType,
      quantity,
      period_start: new Date(subscription.current_period_start).toISOString().split('T')[0],
      period_end: new Date(subscription.current_period_end).toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubscriptionUsage(subscriptionId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('subscription_usage') as any)
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('period_start', { ascending: false })

  if (error) throw error
  return data as SubscriptionUsage[]
}

export async function getCurrentUsage(subscriptionId: string) {
  const supabase = await createClient()

  // Get subscription to determine current period
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('current_period_start, current_period_end')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) return []

  const { data, error } = await (supabase
    .from('subscription_usage') as any)
    .select('resource_type, SUM(quantity) as total')
    .eq('subscription_id', subscriptionId)
    .gte('period_start', new Date(subscription.current_period_start).toISOString().split('T')[0])
    .lte('period_end', new Date(subscription.current_period_end).toISOString().split('T')[0])
    .group('resource_type')

  if (error) throw error
  return data
}

// ============================================================================
// FEATURE GATES
// ============================================================================

export async function getFeatureGates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('feature_gates')
    .select('*')

  if (error) throw error
  return data as FeatureGate[]
}

export async function checkFeatureAccess(
  userId: string,
  featureName: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get feature gate
  const { data: feature } = await (supabase
    .from('feature_gates') as any)
    .select('*')
    .eq('name', featureName)
    .single()

  if (!feature) {
    // Feature not configured, deny access
    return false
  }

  // Get user's subscription tier
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('tier:subscription_tiers(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    // No active subscription, check if free tier has access
    return feature.required_tier?.includes('free') || false
  }

  const tier = subscription.tier as any
  return feature.required_tier?.includes(tier.name) || false
}

export async function checkFeatureWithUsage(
  userId: string,
  featureName: string
): Promise<{ hasAccess: boolean; remaining: number | null }> {
  const supabase = await createClient()

  // Get feature gate
  const { data: feature } = await (supabase
    .from('feature_gates') as any)
    .select('*')
    .eq('name', featureName)
    .single()

  if (!feature) {
    return { hasAccess: false, remaining: null }
  }

  // Check base access
  const hasAccess = await checkFeatureAccess(userId, featureName)
  if (!hasAccess || !feature.is_usage_based) {
    return { hasAccess, remaining: null }
  }

  // Get usage limit
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('id, tier:subscription_tiers(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    return { hasAccess: false, remaining: null }
  }

  const tier = subscription.tier as any
  const limit = tier.limits[feature.usage_limit_key || '']

  if (limit === -1) {
    return { hasAccess: true, remaining: -1 } // Unlimited
  }

  // Get current usage
  const currentUsage = await getCurrentUsage(subscription.id)
  const used = currentUsage?.find((u: any) => u.resource_type === feature.usage_limit_key)?.total || 0
  const remaining = Math.max(0, limit - used)

  return {
    hasAccess: remaining > 0,
    remaining
  }
}

// ============================================================================
// SUBSCRIPTION INVOICES
// ============================================================================

export async function getSubscriptionInvoices(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as SubscriptionInvoice[]
}

export async function createSubscriptionInvoice(
  subscriptionId: string,
  invoiceData: {
    amount: number
    taxAmount?: number
    dueDate: Date
    lineItems: Array<{ description: string; amount: number }>
  }
) {
  const supabase = await createClient()

  // Get subscription
  const { data: subscription } = await (supabase
    .from('user_subscriptions') as any)
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) throw new Error('Subscription not found')

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  const totalAmount = invoiceData.amount + (invoiceData.taxAmount || 0)

  const { data, error } = await (supabase
    .from('subscription_invoices') as any)
    .insert({
      subscription_id: subscriptionId,
      user_id: subscription.user_id,
      invoice_number: invoiceNumber,
      amount: invoiceData.amount,
      tax_amount: invoiceData.taxAmount || 0,
      total_amount: totalAmount,
      billing_period_start: new Date(subscription.current_period_start).toISOString().split('T')[0],
      billing_period_end: new Date(subscription.current_period_end).toISOString().split('T')[0],
      due_date: invoiceData.dueDate.toISOString().split('T')[0],
      status: 'pending',
      line_items: invoiceData.lineItems as any
    })
    .select()
    .single()

  if (error) throw error
  return data as SubscriptionInvoice
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  paymentData?: {
    paymentMethod?: string
    paymentTransactionId?: string
    stripeInvoiceId?: string
    paidAt?: Date
  }
) {
  const supabase = await createClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (paymentData) {
    Object.assign(updateData, paymentData)
    if (paymentData.paidAt) {
      updateData.paid_at = paymentData.paidAt.toISOString()
    }
  }

  const { data, error } = await (supabase
    .from('subscription_invoices') as any)
    .update(updateData)
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) throw error
  return data as SubscriptionInvoice
}

// ============================================================================
// SUBSCRIPTION HISTORY
// ============================================================================

export async function getSubscriptionHistory(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_history')
    .select(`
      *,
      from_tier:subscription_tiers!subscription_history_from_tier_id_fkey(*),
      to_tier:subscription_tiers!subscription_history_to_tier_id_fkey(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function recordSubscriptionHistory(
  userId: string,
  subscriptionId: string | null,
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'expired',
  fromTierId?: string,
  toTierId?: string,
  reason?: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('subscription_history') as any)
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      action,
      from_tier_id: fromTierId,
      to_tier_id: toTierId,
      reason
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// SUBSCRIPTION ANALYTICS (for admin)
// ============================================================================

export async function getSubscriptionRevenue(startDate?: Date, endDate?: Date) {
  const supabase = await createClient()

  let query = (supabase
    .from('subscription_invoices') as any)
    .select('created_at, amount, total_amount, billing_cycle')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate totals
  const totalRevenue = data?.reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0) || 0
  const monthlyRevenue = data?.filter((inv: any) => inv.billing_cycle === 'monthly')
    .reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0) || 0
  const yearlyRevenue = data?.filter((inv: any) => inv.billing_cycle === 'yearly')
    .reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0) || 0

  return {
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    invoiceCount: data?.length || 0,
    invoices: data
  }
}

export async function getActiveSubscriptionsByTier() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('tier:subscription_tiers(*)')
    .eq('status', 'active')

  if (error) throw error

  // Group by tier
  const byTier: Record<string, number> = {}
  data?.forEach((sub: any) => {
    const tierName = sub.tier?.name || 'unknown'
    byTier[tierName] = (byTier[tierName] || 0) + 1
  })

  return {
    total: data?.length || 0,
    byTier
  }
}

export async function getMrr() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('user_subscriptions') as any)
    .select('amount, billing_cycle')
    .eq('status', 'active')

  if (error) throw error

  let mrr = 0
  data?.forEach((sub: any) => {
    if (sub.billing_cycle === 'monthly') {
      mrr += Number(sub.amount)
    } else if (sub.billing_cycle === 'yearly') {
      mrr += Number(sub.amount) / 12
    }
    // Lifetime subscriptions don't count toward MRR
  })

  return {
    mrr,
    activeSubscriptions: data?.length || 0
  }
}
