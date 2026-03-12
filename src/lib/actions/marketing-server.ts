'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReferralData {
  referrer_id: string
  referred_email?: string
  referred_name?: string
  status: 'pending' | 'completed'
}

export interface RewardRedemption {
  user_id: string
  reward_id: string
  reward_title: string
  points_spent: number
}

export interface CampaignProgress {
  user_id: string
  campaign_id: string
  progress_type: 'referral' | 'share' | 'engagement'
  target_id?: string
}

// ============================================================================
// REFERRAL SYSTEM
// ============================================================================

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(userId: string) {
  const supabase = await createClient()

  // Generate a unique code
  const code = 'FSTIVO' + Math.random().toString(36).substring(2, 8).toUpperCase()

  // Update user profile with referral code
  const { data, error } = await (supabase
    .from('user_profiles') as any)
    .update({ referral_code: code })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error('Error generating referral code:', error)
    return { error: 'Failed to generate referral code' }
  }

  revalidatePath('/dashboard/growth', 'page')

  return { success: true, referralCode: code }
}

/**
 * Create a new referral record
 */
export async function createReferral(data: ReferralData) {
  const supabase = await createClient()

  const { data: referral, error } = await (supabase
    .from('referrals') as any)
    .insert({
      referrer_id: data.referrer_id,
      referred_email: data.referred_email,
      referred_name: data.referred_name || 'Friend',
      status: data.status,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    logger.error('Error creating referral:', error)
    return { error: 'Failed to create referral' }
  }

  return { success: true, referral }
}

/**
 * Complete a referral (when referred user attends first event)
 */
export async function completeReferral(referralId: string) {
  const supabase = await createClient()

  // Get referral details
  const { data: referral } = await (supabase
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .single() as any)

  if (!referral) {
    return { error: 'Referral not found' }
  }

  if (referral.status === 'completed') {
    return { error: 'Referral already completed' }
  }

  // Update referral status
  const { error: updateError } = await (supabase
    .from('referrals') as any)
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', referralId)

  if (updateError) {
    return { error: 'Failed to complete referral' }
  }

  // Award points to referrer
  const { error: pointsError } = await (supabase
    .from('user_profiles') as any)
    .update({
      referral_points: (referral.referral_points || 0) + 100,
      total_referrals: (referral.total_referrals || 0) + 1
    })
    .eq('id', referral.referrer_id)

  if (pointsError) {
    logger.error('Error awarding points:', pointsError)
  }

  revalidatePath('/dashboard/growth', 'page')

  return { success: true, message: 'Referral completed! Points awarded.' }
}

/**
 * Get user's referral stats
 */
export async function getUserReferralStats(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await (supabase
    .from('user_profiles')
    .select('referral_code, referral_points, total_referrals')
    .eq('id', userId)
    .single() as any)

  const { data: referrals } = await (supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(10) as any)

  return {
    profile: profile || {},
    referrals: referrals || []
  }
}

// ============================================================================
// REWARD SYSTEM
// ============================================================================

/**
 * Redeem a reward
 */
export async function redeemReward(redemption: RewardRedemption) {
  const supabase = await createClient()

  // Get user's current points
  const { data: profile } = await (supabase
    .from('user_profiles')
    .select('referral_points')
    .eq('id', redemption.user_id)
    .single() as any)

  if (!profile) {
    return { error: 'User profile not found' }
  }

  if (profile.referral_points < redemption.points_spent) {
    return { error: 'Insufficient points' }
  }

  // Create redemption record
  const { data: redemptionRecord, error: redemptionError } = await (supabase
    .from('reward_redemptions') as any)
    .insert({
      user_id: redemption.user_id,
      reward_id: redemption.reward_id,
      reward_title: redemption.reward_title,
      points_spent: redemption.points_spent,
      status: 'completed',
      redeemed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (redemptionError) {
    return { error: 'Failed to create redemption record' }
  }

  // Deduct points from user
  const { error: updateError } = await (supabase
    .from('user_profiles') as any)
    .update({
      referral_points: profile.referral_points - redemption.points_spent
    })
    .eq('id', redemption.user_id)

  if (updateError) {
    return { error: 'Failed to deduct points' }
  }

  revalidatePath('/dashboard/growth', 'page')

  return {
    success: true,
    redemption: redemptionRecord,
    remainingPoints: profile.referral_points - redemption.points_spent
  }
}

/**
 * Get user's redemption history
 */
export async function getUserRedemptions(userId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('reward_redemptions')
    .select('*')
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false })
    .limit(20) as any)

  if (error) {
    return { error: 'Failed to fetch redemptions' }
  }

  return { redemptions: data || [] }
}

// ============================================================================
// CAMPAIGN SYSTEM
// ============================================================================

/**
 * Track campaign progress
 */
export async function trackCampaignProgress(progress: CampaignProgress) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('campaign_progress') as any)
    .insert({
      user_id: progress.user_id,
      campaign_id: progress.campaign_id,
      progress_type: progress.progress_type,
      target_id: progress.target_id,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    logger.error('Error tracking progress:', error)
    return { error: 'Failed to track progress' }
  }

  // Check if user completed a campaign milestone
  await checkCampaignCompletion(progress.user_id, progress.campaign_id)

  return { success: true, progress: data }
}

/**
 * Check and award campaign completion
 */
async function checkCampaignCompletion(userId: string, campaignId: string) {
  const supabase = await createClient()

  // Count progress entries for this user and campaign
  const { count } = await (supabase
    .from('campaign_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('campaign_id', campaignId) as any)

  // Award points if milestone reached
  if (count && count % 5 === 0) {
    await (supabase
      .from('user_profiles') as any)
      .update({
        referral_points: (count) + 50 // Bonus 50 points every 5 actions
      })
      .eq('id', userId)
  }
}

/**
 * Get active campaigns
 */
export async function getActiveCampaigns() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('created_at', { ascending: false }) as any)

  if (error) {
    return { error: 'Failed to fetch campaigns' }
  }

  return { campaigns: data || [] }
}

/**
 * Get user's campaign progress
 */
export async function getUserCampaignProgress(userId: string) {
  const supabase = await createClient()

  const campaignsResult = await getActiveCampaigns()

  if ('error' in campaignsResult) {
    return { campaigns: [] }
  }

  const progressWithCounts = await Promise.all(
    (campaignsResult.campaigns || []).map(async (campaign: any) => {
      const { count } = await (supabase
        .from('campaign_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('campaign_id', campaign.id) as any)

      return {
        ...campaign,
        current: count || 0,
        progress: Math.min(((count || 0) / campaign.target) * 100, 100)
      }
    })
  )

  return { campaigns: progressWithCounts }
}

// ============================================================================
// SHARE TRACKING
// ============================================================================

/**
 * Track an event share
 */
export async function trackShare(userId: string, eventId: string, platform: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('share_tracking') as any)
    .insert({
      user_id: userId,
      event_id: eventId,
      platform: platform,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    logger.error('Error tracking share:', error)
    return { error: 'Failed to track share' }
  }

  // Award points for sharing (10 points per share, max 5 per day)
  const today = new Date().toISOString().split('T')[0]
  const { count: todayShares } = await (supabase
    .from('share_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today)
    .lt('created_at', new Date().toISOString()) as any)

  if (todayShares && todayShares <= 5) {
    await (supabase
      .from('user_profiles') as any)
      .update({
        referral_points: (todayShares * 10)
      })
      .eq('id', userId)
  }

  return { success: true, share: data }
}

/**
 * Get user's share stats
 */
export async function getUserShareStats(userId: string) {
  const supabase = await createClient()

  const { data: shares } = await (supabase
    .from('share_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50) as any)

  const totalShares = shares?.length || 0
  const pointsEarned = Math.min(totalShares, 5) * 10 // Max 5 shares per day counted

  return {
    totalShares,
    pointsEarned,
    recentShares: shares?.slice(0, 10) || []
  }
}

// ============================================================================
// REWARDS CATALOG
// ============================================================================

/**
 * Get available rewards
 */
export async function getRewardsCatalog() {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('rewards_catalog')
    .select('*')
    .eq('active', true)
    .gt('available', 0)
    .order('points', { ascending: true }) as any)

  if (error) {
    return { error: 'Failed to fetch rewards' }
  }

  return { rewards: data || [] }
}
