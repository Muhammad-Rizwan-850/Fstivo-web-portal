'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VolunteerProfile {
  id: string
  user_id: string
  total_points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_hours: number
  total_events: number
  total_earnings: number
  skills: string[]
  rating: number
  bio: string
  availability: string[]
}

export interface VolunteerActivity {
  id: string
  volunteer_id: string
  event_id: string
  event_name: string
  activity_type: string
  hours: number
  points_earned: number
  amount_earned: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  activity_date: string
  feedback?: string
  rating?: number
  created_at: string
}

export interface VolunteerPayout {
  id: string
  volunteer_id: string
  period_start: string
  period_end: string
  total_points: number
  total_amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payment_method: string
  created_at: string
}

export interface EarningsData {
  month: string
  points: number
  earnings: number
}

export interface ActivityDistribution {
  name: string
  value: number
  count: number
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const volunteerActivitySchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  activity_type: z.enum(['setup', 'registration', 'tech_support', 'photography', 'coordination', 'social_media', 'sponsor_relations', 'team_lead']),
  hours: z.number().min(0.5, 'Minimum 0.5 hours').max(24, 'Maximum 24 hours per activity'),
  feedback: z.string().optional(),
})

// ============================================================================
// VOLUNTEER PROFILE ACTIONS
// ============================================================================

/**
 * Get volunteer profile for current user
 */
export async function getVolunteerProfileAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get volunteer profile
  const { data: volunteer, error: volunteerError } = await (supabase
    .from('volunteers') as any)
    .select(`
      *,
      user:user_id(id, full_name, email, avatar_url)
    `)
    .eq('user_id', user.id)
    .single()

  if (volunteerError || !volunteer) {
    // Create volunteer profile if it doesn't exist
    const { data: newVolunteer, error: createError } = await (supabase
      .from('volunteers') as any)
      .insert({
        user_id: user.id,
        total_points: 0,
        tier: 'bronze',
        total_hours: 0,
        total_events: 0,
        total_earnings: 0,
        skills: [],
        rating: 0,
        bio: '',
        availability: [],
      })
      .select()
      .single()

    if (createError) {
      return { error: createError.message }
    }

    return { volunteer: newVolunteer }
  }

  return { volunteer }
}

/**
 * Get volunteer activities with pagination
 */
export async function getVolunteerActivitiesAction(page: number = 1, limit: number = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get volunteer ID
  const { data: volunteer } = await (supabase.from('volunteers') as any)
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!volunteer) {
    return { error: 'Volunteer profile not found' }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  // Get activities with event details
  const { data: activities, error, count } = await (supabase
    .from('volunteer_activities') as any)
    .select(`
      *,
      events(id, title)
    `, { count: 'exact' })
    .eq('volunteer_id', volunteer.id)
    .order('activity_date', { ascending: false })
    .range(from, to)

  if (error) {
    return { error: error.message }
  }

  // Transform data
  const transformedActivities = (activities || []).map((activity: any) => ({
    ...activity,
    event_name: activity.events?.title || 'Unknown Event',
  }))

  return {
    activities: transformedActivities,
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Get volunteer payouts with pagination
 */
export async function getVolunteerPayoutsAction(page: number = 1, limit: number = 10) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get volunteer ID
  const { data: volunteer } = await (supabase.from('volunteers') as any)
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!volunteer) {
    return { error: 'Volunteer profile not found' }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: payouts, error, count } = await (supabase
    .from('volunteer_payouts') as any)
    .select('*', { count: 'exact' })
    .eq('volunteer_id', volunteer.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return { error: error.message }
  }

  return {
    payouts: payouts || [],
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Get volunteer earnings trend (last 6 months)
 */
export async function getVolunteerEarningsTrendAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get volunteer ID
  const { data: volunteer } = await (supabase.from('volunteers') as any)
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!volunteer) {
    return { error: 'Volunteer profile not found' }
  }

  // Calculate date range (last 6 months)
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Get approved activities in the last 6 months
  const { data: activities } = await (supabase
    .from('volunteer_activities') as any)
    .select('activity_date, points_earned, amount_earned')
    .eq('volunteer_id', volunteer.id)
    .in('status', ['approved', 'paid'])
    .gte('activity_date', sixMonthsAgo.toISOString())
    .order('activity_date', { ascending: true })

  if (!activities) {
    return { earnings: [] }
  }

  // Group by month
  const monthlyData = new Map<string, { points: number; earnings: number }>()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthNames[date.getMonth()]
    monthlyData.set(monthKey, { points: 0, earnings: 0 })
  }

  activities.forEach((activity: any) => {
    const date = new Date(activity.activity_date)
    const monthKey = monthNames[date.getMonth()]
    const data = monthlyData.get(monthKey)
    if (data) {
      data.points += activity.points_earned || 0
      data.earnings += activity.amount_earned || 0
    }
  })

  const earnings: EarningsData[] = Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    points: data.points,
    earnings: data.earnings,
  }))

  return { earnings }
}

/**
 * Get volunteer activity distribution by type
 */
export async function getVolunteerActivityDistributionAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get volunteer ID
  const { data: volunteer } = await (supabase.from('volunteers') as any)
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!volunteer) {
    return { error: 'Volunteer profile not found' }
  }

  // Get all approved activities
  const { data: activities } = await (supabase
    .from('volunteer_activities') as any)
    .select('activity_type')
    .eq('volunteer_id', volunteer.id)
    .in('status', ['approved', 'paid'])

  if (!activities) {
    return { distribution: [] }
  }

  // Group by activity type
  const typeCounts = new Map<string, number>()
  activities.forEach((activity: any) => {
    typeCounts.set(activity.activity_type, (typeCounts.get(activity.activity_type) || 0) + 1)
  })

  const total = activities.length
  const distribution: ActivityDistribution[] = Array.from(typeCounts.entries())
    .map(([name, count]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.round((count / total) * 100),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return { distribution }
}

/**
 * Log volunteer activity
 */
export async function logVolunteerActivityAction(formData: {
  event_id: string
  activity_type: string
  hours: number
  feedback?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate form data
  const validatedFields = volunteerActivitySchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Get volunteer ID
  const { data: volunteer } = await (supabase.from('volunteers') as any)
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!volunteer) {
    return { error: 'Volunteer profile not found' }
  }

  // Get point value for this activity type
  const { data: pointConfig } = await (supabase
    .from('activity_points') as any)
    .select('points', 'rate_per_point')
    .eq('activity_type', validatedFields.data.activity_type)
    .single()

  if (!pointConfig) {
    return { error: 'Activity type not found' }
  }

  const pointsEarned = Math.round(validatedFields.data.hours * pointConfig.points)
  const amountEarned = pointsEarned * pointConfig.rate_per_point

  // Create activity record
  const { data: activity, error: activityError } = await (supabase
    .from('volunteer_activities') as any)
    .insert({
      volunteer_id: volunteer.id,
      event_id: validatedFields.data.event_id,
      activity_type: validatedFields.data.activity_type,
      hours: validatedFields.data.hours,
      points_earned: pointsEarned,
      amount_earned: amountEarned,
      status: 'pending',
      activity_date: new Date().toISOString(),
      feedback: validatedFields.data.feedback,
    })
    .select()
    .single()

  if (activityError) {
    return { error: activityError.message }
  }

  revalidatePath('/dashboard/volunteer', 'page')

  return {
    success: true,
    activity,
    message: 'Activity logged successfully! Waiting for approval.',
  }
}

/**
 * Get volunteer dashboard data (all data needed for the dashboard)
 */
export async function getVolunteerDashboardDataAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get all data in parallel
  const [profileResult, activitiesResult, payoutsResult, earningsResult, distributionResult] =
    await Promise.all([
      getVolunteerProfileAction(),
      getVolunteerActivitiesAction(1, 5),
      getVolunteerPayoutsAction(1, 5),
      getVolunteerEarningsTrendAction(),
      getVolunteerActivityDistributionAction(),
    ])

  if (profileResult.error) {
    return { error: profileResult.error }
  }

  return {
    profile: profileResult.volunteer,
    activities: activitiesResult.activities || [],
    payouts: payoutsResult.payouts || [],
    earnings: earningsResult.earnings || [],
    distribution: distributionResult.distribution || [],
  }
}
