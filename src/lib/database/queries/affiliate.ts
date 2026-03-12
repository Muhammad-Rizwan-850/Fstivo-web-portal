/**
 * Affiliate Program Query Functions
 * Database queries for affiliate accounts, referrals, commissions, and payouts
 */

import { createClient } from '@/lib/auth/config'
import type {
  AffiliateAccount,
  AffiliateReferralLink,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateMarketingMaterial,
  AffiliateProgramConfig
} from '@/types/affiliate'

// ============================================================================
// AFFILIATE PROGRAM CONFIG
// ============================================================================

export async function getAffiliateProgramConfig() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_program_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as AffiliateProgramConfig | null
}

// ============================================================================
// AFFILIATE ACCOUNTS
// ============================================================================

export async function getAffiliateAccount(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as AffiliateAccount | null
}

export async function getAffiliateAccountByCode(affiliateCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_accounts')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('affiliate_code', affiliateCode)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createAffiliateAccount(accountData: {
  userId: string
  affiliateCode: string
  paymentMethod?: string
  paymentDetails?: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_accounts')
    .insert({
      user_id: accountData.userId,
      affiliate_code: accountData.affiliateCode,
      payment_method: accountData.paymentMethod,
      payment_details: accountData.paymentDetails as any,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as AffiliateAccount
}

export async function updateAffiliateAccount(
  accountId: string,
  updates: Partial<AffiliateAccount>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateAccount
}

export async function approveAffiliateAccount(
  accountId: string,
  approvedBy: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_accounts')
    .update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateAccount
}

export async function suspendAffiliateAccount(accountId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_accounts')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateAccount
}

export async function getAffiliateStats(accountId: string) {
  const supabase = await createClient()

  const { data: account } = await (supabase as any)
    .from('affiliate_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Affiliate account not found')

  // Get commission breakdown
  const { data: commissions } = await (supabase as any)
    .from('affiliate_commissions')
    .select('status, commission_amount')
    .eq('affiliate_id', accountId)

  const pendingAmount = commissions
    ?.filter((c: any) => c.status === 'pending')
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0

  const approvedAmount = commissions
    ?.filter((c: any) => c.status === 'approved')
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0

  const paidAmount = commissions
    ?.filter((c: any) => c.status === 'paid')
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0

  return {
    account,
    totalClicks: (account as any).total_clicks,
    totalConversions: (account as any).total_conversions,
    conversionRate: (account as any).conversion_rate,
    totalEarned: (account as any).total_earned,
    pendingPayout: (account as any).pending_payout,
    pendingAmount,
    approvedAmount,
    paidAmount
  }
}

// ============================================================================
// AFFILIATE REFERRAL LINKS
// ============================================================================

export async function getAffiliateLinks(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_referral_links')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AffiliateReferralLink[]
}

export async function getAffiliateLink(linkId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_referral_links')
    .select('*')
    .eq('id', linkId)
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

export async function getAffiliateLinkByShortCode(shortCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_referral_links')
    .select('*')
    .eq('short_code', shortCode)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as AffiliateReferralLink | null
}

export async function createAffiliateLink(linkData: {
  affiliateId: string
  linkType: 'general' | 'event_specific' | 'category_specific'
  targetEventId?: string
  targetCategory?: string
  shortCode: string
  fullUrl: string
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .insert({
      affiliate_id: linkData.affiliateId,
      link_type: linkData.linkType,
      target_event_id: linkData.targetEventId,
      target_category: linkData.targetCategory,
      short_code: linkData.shortCode,
      full_url: linkData.fullUrl
    })
    .select()
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

export async function updateAffiliateLink(
  linkId: string,
  updates: Partial<AffiliateReferralLink>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .update(updates)
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

export async function disableAffiliateLink(linkId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .update({ is_active: false })
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

export async function incrementLinkClicks(linkId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .update({
      clicks: (supabase as any).raw('clicks + 1')
    })
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

export async function incrementLinkConversions(linkId: string, amount: number) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .update({
      conversions: (supabase as any).raw('conversions + 1'),
      revenue_generated: (supabase as any).raw(`revenue_generated + ${amount}`)
    })
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateReferralLink
}

// ============================================================================
// AFFILIATE CLICKS
// ============================================================================

export async function recordAffiliateClick(clickData: {
  linkId: string
  affiliateId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  trackingCookie: string
  cookieExpiresAt: Date
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_clicks')
    .insert({
      link_id: clickData.linkId,
      affiliate_id: clickData.affiliateId,
      ip_address: clickData.ipAddress as any,
      user_agent: clickData.userAgent,
      referrer: clickData.referrer,
      tracking_cookie: clickData.trackingCookie,
      cookie_expires_at: clickData.cookieExpiresAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Update affiliate stats
  await updateAffiliateAccount(clickData.affiliateId, {
    total_clicks: (supabase as any).raw('total_clicks + 1')
  })

  // Update link stats
  await incrementLinkClicks(clickData.linkId)

  return data
}

export async function getAffiliateClickByCookie(trackingCookie: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('*, affiliate_referral_links(*)')
    .eq('tracking_cookie', trackingCookie)
    .eq('converted', false)
    .order('clicked_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function recordAffiliateConversion(
  clickId: string,
  registrationId: string
) {
  const supabase = await createClient()

  // Get click details
  const { data: click } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('id', clickId)
    .single()

  if (!click) throw new Error('Click not found')

  // Update click as converted
  const { error: updateError } = await (supabase as any)
    .from('affiliate_clicks')
    .update({
      converted: true,
      registration_id: registrationId,
      converted_at: new Date().toISOString()
    })
    .eq('id', clickId)

  if (updateError) throw updateError

  // Update affiliate stats
  await updateAffiliateAccount((click as any).affiliate_id, {
    total_conversions: (supabase as any).raw('total_conversions + 1')
  })

  // Update link stats if link_id exists
  if ((click as any).link_id) {
    await incrementLinkConversions((click as any).link_id, 0) // Amount will be updated when commission is calculated
  }

  return click
}

export async function getExpiredClicks() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('converted', false)
    .lt('cookie_expires_at', now)

  if (error) throw error
  return data
}

// ============================================================================
// AFFILIATE COMMISSIONS
// ============================================================================

export async function getAffiliateCommissions(
  affiliateId: string,
  status?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('affiliate_commissions')
    .select(`
      *,
      registration:registrations(
        event:events(id, title)
      )
    `)
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createAffiliateCommission(commissionData: {
  affiliateId: string
  registrationId: string
  clickId?: string
  orderAmount: number
  commissionRate: number
  commissionAmount: number
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_commissions')
    .insert({
      affiliate_id: commissionData.affiliateId,
      registration_id: commissionData.registrationId,
      click_id: commissionData.clickId,
      order_amount: commissionData.orderAmount,
      commission_rate: commissionData.commissionRate,
      commission_amount: commissionData.commissionAmount,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Update affiliate pending payout
  await updateAffiliateAccount(commissionData.affiliateId, {
    pending_payout: (supabase as any).raw(`pending_payout + ${commissionData.commissionAmount}`),
    total_earned: (supabase as any).raw(`total_earned + ${commissionData.commissionAmount}`)
  })

  return data as AffiliateCommission
}

export async function approveAffiliateCommission(commissionId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_commissions')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', commissionId)
    .select()
    .single()

  if (error) throw error
  return data as AffiliateCommission
}

export async function payAffiliateCommissions(commissionIds: string[], payoutId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('affiliate_commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .in('id', commissionIds)
    .select()

  if (error) throw error

  // Get affiliate_id from first commission
  if (data && data.length > 0) {
    const commission = data[0] as any
    const totalAmount = data.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0)

    // Update affiliate stats
    await updateAffiliateAccount(commission.affiliate_id, {
      pending_payout: (supabase as any).raw(`pending_payout - ${totalAmount}`),
      total_paid: (supabase as any).raw(`total_paid + ${totalAmount}`)
    })
  }

  return data
}

export async function cancelAffiliateCommission(
  commissionId: string,
  reason: string
) {
  const supabase = await createClient()

  const { data: commission } = await (supabase
    .from('affiliate_commissions') as any)
    .select('*')
    .eq('id', commissionId)
    .single()

  if (!commission) throw new Error('Commission not found')

  const { error } = await (supabase
    .from('affiliate_commissions') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason
    })
    .eq('id', commissionId)

  if (error) throw error

  // Update affiliate pending payout
  if (commission.status === 'pending') {
    await updateAffiliateAccount(commission.affiliate_id, {
      pending_payout: (supabase as any).raw(`pending_payout - ${commission.commission_amount}`)
    })
  }
}

// ============================================================================
// AFFILIATE PAYOUTS
// ============================================================================

export async function getAffiliatePayouts(affiliateId: string, status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('affiliate_payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as AffiliatePayout[]
}

export async function createAffiliatePayout(payoutData: {
  affiliateId: string
  amount: number
  commissionIds: string[]
  paymentMethod: string
  paymentDetails: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('affiliate_payouts') as any)
    .insert({
      affiliate_id: payoutData.affiliateId,
      amount: payoutData.amount,
      commission_ids: payoutData.commissionIds,
      payment_method: payoutData.paymentMethod,
      payment_details: payoutData.paymentDetails as any,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as AffiliatePayout
}

export async function updatePayoutStatus(
  payoutId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  updateData?: {
    processedAt?: Date
    completedAt?: Date
    failedAt?: Date
    paymentReference?: string
    failureReason?: string
  }
) {
  const supabase = await createClient()

  const data: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (updateData) {
    if (updateData.processedAt) {
      data.processed_at = updateData.processedAt.toISOString()
    }
    if (updateData.completedAt) {
      data.completed_at = updateData.completedAt.toISOString()
    }
    if (updateData.failedAt) {
      data.failed_at = updateData.failedAt.toISOString()
    }
    if (updateData.paymentReference) {
      data.payment_reference = updateData.paymentReference
    }
    if (updateData.failureReason) {
      data.failure_reason = updateData.failureReason
    }
  }

  const { error } = await (supabase
    .from('affiliate_payouts') as any)
    .update(data)
    .eq('id', payoutId)

  if (error) throw error
}

export async function getPayoutsReadyForProcessing(limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_payouts')
    .select(`
      *,
      affiliate_accounts(
        user_id,
        profiles(id, full_name, email)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================================================
// AFFILIATE MARKETING MATERIALS
// ============================================================================

export async function getMarketingMaterials(materialType?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('affiliate_marketing_materials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (materialType) {
    query = query.eq('material_type', materialType)
  }

  const { data, error } = await query

  if (error) throw error
  return data as AffiliateMarketingMaterial[]
}

export async function incrementMaterialDownloads(materialId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('affiliate_marketing_materials') as any)
    .update({
      download_count: (supabase as any).raw('download_count + 1')
    })
    .eq('id', materialId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// AFFILIATE LEADERBOARD
// ============================================================================

export async function getAffiliateLeaderboard(limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_leaderboard')
    .select('*')
    .order('all_time_rank', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function refreshLeaderboard() {
  const supabase = await createClient()

  const { error } = await supabase.rpc('refresh_affiliate_leaderboard')

  if (error) throw error
}

export async function getAffiliateRank(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_leaderboard')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ============================================================================
// AFFILIATE ANALYTICS
// ============================================================================

export async function getAffiliatePerformanceOverview(affiliateId: string) {
  const supabase = await createClient()

  const { data: account } = await (supabase
    .from('affiliate_accounts') as any)
    .select('*')
    .eq('id', affiliateId)
    .single()

  if (!account) throw new Error('Affiliate account not found')

  // Get this month's performance
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyCommissions } = await (supabase
    .from('affiliate_commissions') as any)
    .select('commission_amount, status')
    .eq('affiliate_id', affiliateId)
    .gte('created_at', startOfMonth.toISOString())

  const monthlyEarnings = monthlyCommissions
    ?.filter((c: any) => c.status === 'approved' || c.status === 'paid')
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0

  const monthlyPending = monthlyCommissions
    ?.filter((c: any) => c.status === 'pending')
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0) || 0

  // Get link performance
  const { data: links } = await (supabase
    .from('affiliate_referral_links') as any)
    .select('*')
    .eq('affiliate_id', affiliateId)
    .eq('is_active', true)

  const topLinks = links
    ?.sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 5) || []

  return {
    account,
    stats: {
      totalClicks: account.total_clicks,
      totalConversions: account.total_conversions,
      conversionRate: account.conversion_rate,
      totalEarned: account.total_earned,
      totalPaid: account.total_paid,
      pendingPayout: account.pending_payout
    },
    monthly: {
      earnings: monthlyEarnings,
      pending: monthlyPending
    },
    topLinks
  }
}

export async function getTopAffiliates(limit = 10, timePeriod = 'all_time') {
  const supabase = await createClient()

  let orderByColumn = 'all_time_rank'
  if (timePeriod === 'month') {
    orderByColumn = 'month_rank'
  }

  const { data, error } = await supabase
    .from('affiliate_leaderboard')
    .select('*')
    .order(orderByColumn, { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getPendingCommissionsCount(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .eq('status', 'pending')

  if (error) throw error
  return data || 0
}

export async function getAffiliateEarningsReport(
  affiliateId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient()

  const { data: commissions } = await (supabase
    .from('affiliate_commissions') as any)
    .select('*')
    .eq('affiliate_id', affiliateId)
    .in('status', ['approved', 'paid'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (commissions && commissions.length > 0) {
    const totalAmount = commissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0)
    const totalSales = commissions.reduce((sum: number, c: any) => sum + Number(c.order_amount), 0)

    return {
      commissions,
      totalAmount,
      totalSales,
      commissionCount: commissions.length
    }
  }

  return {
    commissions: [],
    totalAmount: 0,
    totalSales: 0,
    commissionCount: 0
  }
}
