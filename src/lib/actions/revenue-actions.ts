'use server'

/**
 * Revenue & Monetization Server Actions
 * Server actions for subscriptions, sponsored ads, and affiliate programs
 */

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'

// Minimal domain types used in this file to avoid `as any` casts
type SubscriptionTier = {
  id: string
  price_monthly: number
  price_yearly: number
  features?: Record<string, boolean>
}

type UserSubscription = {
  id: string
  user_id: string
  tier_id: string
  billing_cycle: 'monthly' | 'yearly'
  amount: number
  current_period_start?: string
  current_period_end?: string
  status?: string
  tier?: SubscriptionTier
}

type SponsoredSlot = {
  id: string
  price_per_day: number
}

type Booking = {
  id: string
}

type BannerAd = {
  id: string
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT ACTIONS
// ============================================================================

export async function getSubscriptionTiers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) return { error: error.message }
  return { tiers: data }
}

export async function getCurrentSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      tier:subscription_tiers(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    return { error: error.message }
  }

  return { subscription: data }
}

export async function createSubscription(
  tierId: string,
  billingCycle: 'monthly' | 'yearly',
  paymentMethod: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Get tier details
  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', tierId)
    .single()

  if (!tier) return { error: 'Invalid tier' }

  const amount = billingCycle === 'monthly'
    ? (tier as any).price_monthly
    : (tier as any).price_yearly

  // Calculate period
  const periodStart = new Date()
  const periodEnd = new Date(periodStart)
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  // Create subscription
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
    } as any)
    .select()
    .single()

  if (error) return { error: error.message }

  // Create first invoice
  await createSubscriptionInvoice((subscription as any).id, amount)

  // Record history
  await supabase.from('subscription_history').insert({
    user_id: user.id,
    subscription_id: (subscription as any).id,
    action: 'created',
    to_tier_id: tierId
  } as any)

  revalidatePath('/dashboard/subscription')
  return { subscription }
}

export async function upgradeSubscription(newTierId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Get current subscription
  const { data: currentSub } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!currentSub) return { error: 'No active subscription' }

  // Get new tier
  const { data: newTier } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('id', newTierId)
    .single()

  if (!newTier) return { error: 'Invalid tier' }

  // Update subscription
  const newAmount = (currentSub as any).billing_cycle === 'monthly'
    ? (newTier as any).price_monthly
    : (newTier as any).price_yearly

  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      tier_id: newTierId,
      amount: newAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', (currentSub as any).id)

  if (error) return { error: error.message }

  // Record history
  await supabase.from('subscription_history').insert({
    user_id: user.id,
    subscription_id: (currentSub as any).id,
    action: 'upgraded',
    from_tier_id: (currentSub as any).tier_id,
    to_tier_id: newTierId
  } as any)

  revalidatePath('/dashboard/subscription')
  return { success: true }
}

export async function cancelSubscription(reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!subscription) return { error: 'No active subscription' }

  // Cancel at period end
  const { error } = await (supabase
    .from('user_subscriptions') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', (subscription as any).id)

  if (error) return { error: error.message }

  // Record history
  await supabase.from('subscription_history').insert({
    user_id: user.id,
    subscription_id: (subscription as any).id,
    action: 'cancelled',
    reason
  } as any)

  revalidatePath('/dashboard/subscription')
  return { success: true }
}

export async function checkFeatureAccess(featureName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { hasAccess: false }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, tier:subscription_tiers(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!subscription) return { hasAccess: false }

  const hasAccess = (subscription as any).tier.features[featureName] === true
  return { hasAccess }
}

async function createSubscriptionInvoice(subscriptionId: string, amount: number) {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) return

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  await supabase.from('subscription_invoices').insert({
    subscription_id: subscriptionId,
    user_id: (subscription as any).user_id,
    invoice_number: invoiceNumber,
    amount,
    total_amount: amount,
    billing_period_start: (subscription as any).current_period_start,
    billing_period_end: (subscription as any).current_period_end,
    due_date: new Date().toISOString(),
    status: 'pending',
    line_items: [{
      description: 'Subscription fee',
      amount
    }]
  } as any)
}

// ============================================================================
// SPONSORED EVENTS & ADS ACTIONS
// ============================================================================

export async function getSponsoredSlots() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sponsored_event_slots')
    .select('*')
    .eq('is_active', true)
    .order('position')

  if (error) return { error: error.message }
  return { slots: data }
}

export async function bookSponsoredSlot(data: {
  event_id: string
  slot_id: string
  start_date: string
  end_date: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Get slot pricing
  const { data: slot } = await supabase
    .from('sponsored_event_slots')
    .select('*')
    .eq('id', data.slot_id)
    .single()

  if (!slot) return { error: 'Invalid slot' }

  // Calculate days
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const totalAmount = (slot as any).price_per_day * days

  // Create booking
  const { data: booking, error } = await (supabase
    .from('sponsored_event_bookings')
    .insert({
      event_id: data.event_id,
      slot_id: data.slot_id,
      sponsor_user_id: user.id,
      start_date: data.start_date,
      end_date: data.end_date,
      daily_rate: (slot as any).price_per_day,
      total_amount: totalAmount,
      status: 'pending'
    } as any)
    .select()
    .single() as any)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/sponsored-events')
  return { booking }
}

export async function createBannerAd(data: {
  title: string
  description?: string
  image_url: string
  destination_url: string
  call_to_action?: string
  placement: string
  budget_type: string
  budget_amount: number
  start_date: string
  end_date?: string
  target_categories?: string[]
  target_cities?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: ad, error } = await (supabase
    .from('banner_ads')
    .insert({
      ...data,
      advertiser_id: user.id,
      status: 'pending_review'
    } as any)
    .select()
    .single() as any)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/ads')
  return { ad }
}

export async function trackAdImpression(adId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Record impression
  await (supabase.from('ad_tracking').insert({
    ad_id: adId,
    event_type: 'impression',
    user_id: user?.id,
    session_id: crypto.randomUUID()
  } as any) as any)

  // Update ad stats
  await (supabase.rpc('increment', {
    table_name: 'banner_ads',
    row_id: adId,
    column_name: 'impressions'
  } as any) as any)

  return { success: true }
}

export async function trackAdClick(adId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Record click
  await (supabase.from('ad_tracking').insert({
    ad_id: adId,
    event_type: 'click',
    user_id: user?.id,
    session_id: crypto.randomUUID()
  } as any) as any)

  // Update ad stats
  await (supabase.rpc('increment', {
    table_name: 'banner_ads',
    row_id: adId,
    column_name: 'clicks'
  } as any) as any)

  return { success: true }
}

export async function createSponsorProfile(data: {
  company_name: string
  industry?: string
  description?: string
  logo_url?: string
  website_url?: string
  interested_categories?: string[]
  interested_cities?: string[]
  budget_range?: { min: number; max: number }
  sponsorship_type?: string[]
  contact_name?: string
  contact_email?: string
  contact_phone?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile, error } = await (supabase as any)
    .from('sponsor_profiles')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/sponsor-profile')
  return { profile }
}

export async function getSponsorMatches(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sponsor_matches')
    .select(`
      *,
      sponsor:sponsor_profiles(*)
    `)
    .eq('event_id', eventId)
    .order('match_score', { ascending: false })
    .limit(10)

  if (error) return { error: error.message }
  return { matches: data }
}

// ============================================================================
// AFFILIATE PROGRAM ACTIONS
// ============================================================================

export async function createAffiliateAccount(paymentDetails: {
  payment_method: string
  payment_details: any
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Generate unique affiliate code
  const affiliateCode = `AFF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  const { data: account, error } = await (supabase as any)
    .from('affiliate_accounts')
    .insert({
      user_id: user.id,
      affiliate_code: affiliateCode,
      ...paymentDetails,
      status: 'pending'
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/affiliate')
  return { account }
}

export async function getAffiliateAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { error: error.message }
  }

  return { account: data }
}

export async function createAffiliateLink(data: {
  link_type: string
  target_event_id?: string
  target_category?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Get affiliate account
  const { data: account } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!(account as any) || (account as any).status !== 'active') {
    return { error: 'Affiliate account not active' }
  }

  // Generate short code
  const shortCode = Math.random().toString(36).substr(2, 8).toUpperCase()

  // Build full URL
  let fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}?ref=${(account as any).affiliate_code}`
  if (data.target_event_id) {
    fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/${data.target_event_id}?ref=${(account as any).affiliate_code}`
  } else if (data.target_category) {
    fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events?category=${data.target_category}&ref=${(account as any).affiliate_code}`
  }

  const { data: link, error } = await (supabase as any)
    .from('affiliate_referral_links')
    .insert({
      affiliate_id: (account as any).id,
      ...data,
      short_code: shortCode,
      full_url: fullUrl
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/affiliate/links')
  return { link }
}

export async function trackAffiliateClick(affiliateCode: string, linkId?: string) {
  const supabase = await createClient()

  // Get affiliate account
  const { data: account } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('affiliate_code', affiliateCode)
    .single()

  if (!account) return { error: 'Invalid affiliate code' }

  // Generate tracking cookie
  const trackingCookie = crypto.randomUUID()
  const cookieExpiresAt = new Date()
  cookieExpiresAt.setDate(cookieExpiresAt.getDate() + 30) // 30 days

  // Record click
  await (supabase as any).from('affiliate_clicks').insert({
    link_id: linkId,
    affiliate_id: (account as any).id,
    tracking_cookie: trackingCookie,
    cookie_expires_at: cookieExpiresAt.toISOString()
  })

  // Update affiliate stats
  await (supabase as any)
    .from('affiliate_accounts')
    .update({ total_clicks: (account as any).total_clicks + 1 })
    .eq('id', (account as any).id)

  return { trackingCookie }
}

export async function recordAffiliateConversion(
  registrationId: string,
  trackingCookie: string
) {
  const supabase = await createClient()

  // Find click by cookie
  const { data: click } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('tracking_cookie', trackingCookie)
    .eq('converted', false)
    .single()

  if (!click) return { success: false }

  // Get registration amount
  const { data: registration } = await supabase
    .from('registrations')
    .select('total_amount')
    .eq('id', registrationId)
    .single()

  if (!registration) return { error: 'Registration not found' }

  // Calculate commission
  const { data: commission_amount } = await (supabase as any).rpc(
    'calculate_affiliate_commission',
    {
      p_order_amount: (registration as any).total_amount,
      p_affiliate_id: (click as any).affiliate_id
    }
  )

  // Get commission rate
  const { data: config } = await supabase
    .from('affiliate_program_config')
    .select('commission_percentage')
    .eq('is_active', true)
    .single()

  // Create commission
  await (supabase as any).from('affiliate_commissions').insert({
    affiliate_id: (click as any).affiliate_id,
    registration_id: registrationId,
    click_id: (click as any).id,
    order_amount: (registration as any).total_amount,
    commission_rate: (config as any)?.commission_percentage || 10,
    commission_amount: commission_amount || 0,
    status: 'pending'
  })

  // Update click
  await (supabase as any)
    .from('affiliate_clicks')
    .update({
      converted: true,
      registration_id: registrationId,
      converted_at: new Date().toISOString()
    })
    .eq('id', (click as any).id)

  // Update affiliate stats
  await (supabase as any)
    .from('affiliate_accounts')
    .update({
      total_conversions: (supabase as any).raw('total_conversions + 1'),
      total_earned: (supabase as any).raw(`total_earned + ${commission_amount}`),
      pending_payout: (supabase as any).raw(`pending_payout + ${commission_amount}`)
    })
    .eq('id', (click as any).affiliate_id)

  return { success: true }
}

export async function getAffiliateStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: account } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!account) return { error: 'No affiliate account' }

  // Get detailed stats
  const [
    { data: commissions },
    { data: links },
    { data: recentConversions }
  ] = await Promise.all([
    (supabase as any)
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_id', (account as any).id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('affiliate_referral_links')
      .select('*')
      .eq('affiliate_id', (account as any).id),
    (supabase as any)
      .from('affiliate_commissions')
      .select(`
        *,
        registration:registrations(
          event:events(title)
        )
      `)
      .eq('affiliate_id', (account as any).id)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  return {
    account,
    commissions,
    links,
    recentConversions
  }
}

export async function getAffiliateLeaderboard() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_leaderboard')
    .select('*')
    .limit(50)

  if (error) return { error: error.message }
  return { leaderboard: data }
}

export async function requestAffiliatePayout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: account } = await supabase
    .from('affiliate_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!account) return { error: 'No affiliate account' }

  // Check minimum payout
  const { data: config } = await supabase
    .from('affiliate_program_config')
    .select('minimum_payout')
    .eq('is_active', true)
    .single()

  if ((account as any).pending_payout < ((config as any)?.minimum_payout || 1000)) {
    return { error: `Minimum payout is ${(config as any)?.minimum_payout} PKR` }
  }

  // Get approved commissions
  const { data: commissions } = await (supabase as any)
    .from('affiliate_commissions')
    .select('id')
    .eq('affiliate_id', (account as any).id)
    .eq('status', 'approved')

  if (!commissions || commissions.length === 0) {
    return { error: 'No approved commissions to payout' }
  }

  // Create payout
  const { data: payout, error } = await (supabase as any)
    .from('affiliate_payouts')
    .insert({
      affiliate_id: (account as any).id,
      amount: (account as any).pending_payout,
      commission_ids: commissions.map((c: any) => c.id),
      payment_method: (account as any).payment_method,
      payment_details: (account as any).payment_details,
      status: 'pending'
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/affiliate/payouts')
  return { payout }
}

export async function getMarketingMaterials() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_marketing_materials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { materials: data }
}
