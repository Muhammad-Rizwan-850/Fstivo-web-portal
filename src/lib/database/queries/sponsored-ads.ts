/**
 * Sponsored Ads & Events Query Functions
 * Database queries for sponsored events, banner ads, and sponsor management
 */

import { createClient } from '@/lib/auth/config'
import type {
  SponsoredEventSlot,
  SponsoredEventBooking,
  BannerAd,
  AdTracking,
  SponsorProfile,
  SponsorMatch
} from '@/types/sponsored-ads'

// ============================================================================
// SPONSORED EVENT SLOTS
// ============================================================================

export async function getSponsoredSlots(placement?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('sponsored_event_slots')
    .select('*')
    .eq('is_active', true)
    .order('position')

  if (placement) {
    query = query.eq('placement', placement)
  }

  const { data, error } = await query

  if (error) throw error
  return data as SponsoredEventSlot[]
}

export async function getSponsoredSlot(slotId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sponsored_event_slots')
    .select('*')
    .eq('id', slotId)
    .single()

  if (error) throw error
  return data as SponsoredEventSlot
}

// ============================================================================
// SPONSORED EVENT BOOKINGS
// ============================================================================

export async function getSponsoredBookings(filters?: {
  eventId?: string
  sponsorUserId?: string
  slotId?: string
  status?: string
  startDate?: Date
  endDate?: Date
}) {
  const supabase = await createClient()

  let query = supabase
    .from('sponsored_event_bookings')
    .select(`
      *,
      event:events(id, title, image_url),
      slot:sponsored_event_slots(*),
      sponsor:profiles(id, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId)
  }

  if (filters?.sponsorUserId) {
    query = query.eq('sponsor_user_id', filters.sponsorUserId)
  }

  if (filters?.slotId) {
    query = query.eq('slot_id', filters.slotId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate.toISOString().split('T')[0])
  }

  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createSponsoredBooking(bookingData: {
  eventId: string
  slotId: string
  sponsorUserId: string
  startDate: Date
  endDate: Date
  dailyRate: number
  totalAmount: number
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsored_event_bookings') as any)
    .insert({
      event_id: bookingData.eventId,
      slot_id: bookingData.slotId,
      sponsor_user_id: bookingData.sponsorUserId,
      start_date: bookingData.startDate.toISOString().split('T')[0],
      end_date: bookingData.endDate.toISOString().split('T')[0],
      daily_rate: bookingData.dailyRate,
      total_amount: bookingData.totalAmount,
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as SponsoredEventBooking
}

export async function updateSponsoredBooking(
  bookingId: string,
  updates: Partial<SponsoredEventBooking>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsored_event_bookings') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data as SponsoredEventBooking
}

export async function approveSponsoredBooking(
  bookingId: string,
  approvedBy: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsored_event_bookings') as any)
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data as SponsoredEventBooking
}

export async function rejectSponsoredBooking(
  bookingId: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsored_event_bookings') as any)
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data as SponsoredEventBooking
}

export async function getActiveSponsoredEvents(placement?: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('sponsored_event_bookings')
    .select(`
      *,
      event:events(id, title, slug, image_url, start_date, location),
      slot:sponsored_event_slots(*)
    `)
    .eq('status', 'active')
    .gte('start_date', today)
    .lte('end_date', today)
    .order('start_date', { ascending: false })

  if (placement) {
    query = query.eq('slot.placement', placement)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ============================================================================
// BANNER ADS
// ============================================================================

export async function getBannerAds(filters?: {
  advertiserId?: string
  placement?: string
  status?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('banner_ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.advertiserId) {
    query = query.eq('advertiser_id', filters.advertiserId)
  }

  if (filters?.placement) {
    query = query.eq('placement', filters.placement)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as BannerAd[]
}

export async function getBannerAd(adId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('banner_ads')
    .select('*')
    .eq('id', adId)
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function createBannerAd(adData: {
  advertiserId: string
  title: string
  description?: string
  imageUrl: string
  destinationUrl: string
  callToAction?: string
  placement: string
  budgetType: 'daily' | 'total' | 'per_click' | 'per_impression'
  budgetAmount: number
  startDate: Date
  endDate?: Date
  targetCategories?: string[]
  targetCities?: string[]
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('banner_ads') as any)
    .insert({
      advertiser_id: adData.advertiserId,
      title: adData.title,
      description: adData.description,
      image_url: adData.imageUrl,
      destination_url: adData.destinationUrl,
      call_to_action: adData.callToAction,
      placement: adData.placement,
      budget_type: adData.budgetType,
      budget_amount: adData.budgetAmount,
      start_date: adData.startDate.toISOString().split('T')[0],
      end_date: adData.endDate?.toISOString().split('T')[0],
      target_categories: adData.targetCategories,
      target_cities: adData.targetCities,
      status: 'pending_review'
    })
    .select()
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function updateBannerAd(
  adId: string,
  updates: Partial<BannerAd>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('banner_ads') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', adId)
    .select()
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function approveBannerAd(
  adId: string,
  approvedBy: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('banner_ads') as any)
    .update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', adId)
    .select()
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function rejectBannerAd(
  adId: string,
  rejectionReason: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('banner_ads') as any)
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', adId)
    .select()
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function pauseBannerAd(adId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('banner_ads') as any)
    .update({
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('id', adId)
    .select()
    .single()

  if (error) throw error
  return data as BannerAd
}

export async function getActiveBannerAds(placement?: string, limit = 10) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('banner_ads')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (placement) {
    query = query.eq('placement', placement)
  }

  const { data, error } = await query

  if (error) throw error
  return data as BannerAd[]
}

// ============================================================================
// AD TRACKING
// ============================================================================

export async function recordAdImpression(
  adId: string,
  trackingData?: {
    userId?: string
    sessionId?: string
    ipAddress?: string
    userAgent?: string
    pageUrl?: string
    referrer?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('ad_tracking') as any)
    .insert({
      ad_id: adId,
      event_type: 'impression',
      user_id: trackingData?.userId,
      session_id: trackingData?.sessionId,
      ip_address: trackingData?.ipAddress as any,
      user_agent: trackingData?.userAgent,
      page_url: trackingData?.pageUrl,
      referrer: trackingData?.referrer
    })
    .select()
    .single()

  if (error) throw error

  // Increment ad impressions count
  await supabase.rpc('increment', {
    table_name: 'banner_ads',
    row_id: adId,
    column_name: 'impressions'
  } as any)

  return data
}

export async function recordAdClick(
  adId: string,
  trackingData?: {
    userId?: string
    sessionId?: string
    ipAddress?: string
    userAgent?: string
    pageUrl?: string
    referrer?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('ad_tracking') as any)
    .insert({
      ad_id: adId,
      event_type: 'click',
      user_id: trackingData?.userId,
      session_id: trackingData?.sessionId,
      ip_address: trackingData?.ipAddress as any,
      user_agent: trackingData?.userAgent,
      page_url: trackingData?.pageUrl,
      referrer: trackingData?.referrer
    })
    .select()
    .single()

  if (error) throw error

  // Increment ad clicks count
  await supabase.rpc('increment', {
    table_name: 'banner_ads',
    row_id: adId,
    column_name: 'clicks'
  } as any)

  return data
}

export async function recordAdConversion(
  adId: string,
  trackingData?: {
    userId?: string
    sessionId?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('ad_tracking') as any)
    .insert({
      ad_id: adId,
      event_type: 'conversion',
      user_id: trackingData?.userId,
      session_id: trackingData?.sessionId
    })
    .select()
    .single()

  if (error) throw error

  // Increment ad conversions count
  await supabase.rpc('increment', {
    table_name: 'banner_ads',
    row_id: adId,
    column_name: 'conversions'
  } as any)

  return data
}

export async function getAdTracking(adId: string, startDate?: Date, endDate?: Date) {
  const supabase = await createClient()

  let query = supabase
    .from('ad_tracking')
    .select('*')
    .eq('ad_id', adId)
    .order('timestamp', { ascending: false })

  if (startDate) {
    query = query.gte('timestamp', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('timestamp', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data as AdTracking[]
}

export async function getSponsoredBookingTracking(bookingId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ad_tracking')
    .select('*')
    .eq('booking_id', bookingId)
    .order('timestamp', { ascending: false })

  if (error) throw error
  return data as AdTracking[]
}

// ============================================================================
// SPONSOR PROFILES
// ============================================================================

export async function getSponsorProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sponsor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as SponsorProfile | null
}

export async function createSponsorProfile(profileData: {
  userId: string
  companyName: string
  industry?: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  interestedCategories?: string[]
  interestedCities?: string[]
  budgetRange?: { min: number; max: number }
  sponsorshipType?: string[]
  contactName?: string
  contactEmail?: string
  contactPhone?: string
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsor_profiles') as any)
    .insert({
      user_id: profileData.userId,
      company_name: profileData.companyName,
      industry: profileData.industry,
      description: profileData.description,
      logo_url: profileData.logoUrl,
      website_url: profileData.websiteUrl,
      interested_categories: profileData.interestedCategories,
      interested_cities: profileData.interestedCities,
      budget_range: profileData.budgetRange as any,
      sponsorship_type: profileData.sponsorshipType,
      contact_name: profileData.contactName,
      contact_email: profileData.contactEmail,
      contact_phone: profileData.contactPhone
    })
    .select()
    .single()

  if (error) throw error
  return data as SponsorProfile
}

export async function updateSponsorProfile(
  profileId: string,
  updates: Partial<SponsorProfile>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsor_profiles') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single()

  if (error) throw error
  return data as SponsorProfile
}

export async function getSponsors(filters?: {
  industry?: string
  city?: string
  category?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('sponsor_profiles')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters?.industry) {
    query = query.eq('industry', filters.industry)
  }

  if (filters?.city) {
    query = query.contains('interested_cities', [filters.city])
  }

  if (filters?.category) {
    query = query.contains('interested_categories', [filters.category])
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ============================================================================
// SPONSOR MATCHES
// ============================================================================

export async function getSponsorMatches(eventId: string, limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sponsor_matches')
    .select(`
      *,
      sponsor:sponsor_profiles(*, profiles(id, full_name, avatar_url))
    `)
    .eq('event_id', eventId)
    .order('match_score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function createSponsorMatch(matchData: {
  sponsorId: string
  eventId: string
  matchScore: number
  matchReasons?: string[]
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('sponsor_matches') as any)
    .insert({
      sponsor_id: matchData.sponsorId,
      event_id: matchData.eventId,
      match_score: matchData.matchScore,
      match_reasons: matchData.matchReasons as any,
      status: 'suggested'
    })
    .select()
    .single()

  if (error) throw error
  return data as SponsorMatch
}

export async function updateSponsorMatchStatus(
  matchId: string,
  status: 'suggested' | 'contacted' | 'interested' | 'declined' | 'confirmed'
) {
  const supabase = await createClient()

  const updateData: any = { status }

  if (status === 'contacted') {
    updateData.contacted_at = new Date().toISOString()
  } else if (status === 'interested' || status === 'declined') {
    updateData.responded_at = new Date().toISOString()
  }

  const { data, error } = await (supabase
    .from('sponsor_matches') as any)
    .update(updateData)
    .eq('id', matchId)
    .select()
    .single()

  if (error) throw error
  return data as SponsorMatch
}

// ============================================================================
// AD ANALYTICS
// ============================================================================

export async function getAdPerformance(adId: string) {
  const supabase = await createClient()

  const { data: ad } = await (supabase
    .from('banner_ads') as any)
    .select('*')
    .eq('id', adId)
    .single()

  if (!ad) throw new Error('Ad not found')

  const { data: tracking } = await (supabase
    .from('ad_tracking') as any)
    .select('event_type')
    .eq('ad_id', adId)

  const impressions = tracking?.filter((t: any) => t.event_type === 'impression').length || 0
  const clicks = tracking?.filter((t: any) => t.event_type === 'click').length || 0
  const conversions = tracking?.filter((t: any) => t.event_type === 'conversion').length || 0

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpa = conversions > 0 ? ad.spent_amount / conversions : 0

  return {
    ad,
    impressions,
    clicks,
    conversions,
    ctr,
    cpa,
    spentAmount: ad.spent_amount,
    remainingBudget: ad.budget_amount - ad.spent_amount
  }
}

export async function getSponsoredBookingPerformance(bookingId: string) {
  const supabase = await createClient()

  const { data: booking } = await (supabase
    .from('sponsored_event_bookings') as any)
    .select('*')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found')

  const { data: tracking } = await (supabase
    .from('ad_tracking') as any)
    .select('event_type')
    .eq('booking_id', bookingId)

  const impressions = tracking?.filter((t: any) => t.event_type === 'impression').length || 0
  const clicks = tracking?.filter((t: any) => t.event_type === 'click').length || 0
  const conversions = tracking?.filter((t: any) => t.event_type === 'conversion').length || 0

  return {
    booking,
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpa: conversions > 0 ? booking.total_amount / conversions : 0
  }
}

export async function getOverallAdPerformance(startDate?: Date, endDate?: Date) {
  const supabase = await createClient()

  let query = (supabase
    .from('banner_ads') as any)
    .select('*')

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data: ads } = await query

  const totalImpressions = ads?.reduce((sum: number, ad: any) => sum + ad.impressions, 0) || 0
  const totalClicks = ads?.reduce((sum: number, ad: any) => sum + ad.clicks, 0) || 0
  const totalConversions = ads?.reduce((sum: number, ad: any) => sum + ad.conversions, 0) || 0
  const totalSpent = ads?.reduce((sum: number, ad: any) => sum + Number(ad.spent_amount), 0) || 0

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const avgCpa = totalConversions > 0 ? totalSpent / totalConversions : 0
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0

  return {
    totalAds: ads?.length || 0,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalSpent,
    avgCtr,
    avgCpc,
    avgCpa
  }
}
