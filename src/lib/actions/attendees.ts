/**
 * Attendee Server Actions
 * Server-side functions for attendee dashboard operations
 */

'use server'

import { createClient } from '@/lib/auth/config'
import { generateRegistrationQRCode } from '@/lib/qr/generate'
import type { RegistrationWithEvent, UserDashboardStats, TicketQRResult } from '@/lib/types'
import { logger } from '@/lib/logger';

/**
 * Fetch user's dashboard statistics
 */
export async function fetchUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  try {
    const supabase = await createClient()

    // Get all user's registrations
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('status, payment_status, checked_in_at, total_amount, event:events(start_date)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')

    if (error) throw error

    const now = new Date()
    const stats: UserDashboardStats = {
      totalRegistrations: registrations?.length || 0,
      upcomingEvents: registrations?.filter((r: any) => {
        const eventDate = new Date(r.event?.start_date)
        return eventDate > now && r.status === 'confirmed'
      }).length || 0,
      checkedInCount: registrations?.filter((r: any) => r.checked_in_at).length || 0,
      pendingPayments: registrations?.filter((r: any) => r.payment_status === 'pending').length || 0,
      totalSpent:
        registrations?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0,
      eventsAttended: registrations?.filter((r: any) => r.status === 'attended').length || 0,
    }

    return stats
  } catch (error) {
    logger.error('[Server] Failed to fetch user dashboard stats:', error)
    throw error
  }
}

/**
 * Fetch user's registrations with event details
 */
export async function fetchUserRegistrationsWithEvents(
  userId: string,
  options?: { status?: string; limit?: number; offset?: number }
): Promise<{ registrations: RegistrationWithEvent[]; total: number }> {
  try {
    const supabase = await createClient()
    const { status, limit = 50, offset = 0 } = options || {}

    let query = supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, start_date, end_date, venue_city, cover_image_url, event_mode, status),
        ticket_type:ticket_types(id, name, price)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Get total count
    const { count } = await query

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error

    return {
      registrations: (data || []) as RegistrationWithEvent[],
      total: count || 0,
    }
  } catch (error) {
    logger.error('[Server] Failed to fetch user registrations:', error)
    throw error
  }
}

/**
 * Generate QR code for a ticket
 */
export async function generateTicketQR(registrationId: string): Promise<TicketQRResult | null> {
  try {
    const supabase = await createClient()

    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(title, start_date, venue_city),
        ticket_type:ticket_types(name),
        user:profiles(full_name)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      logger.error('[Server] Registration not found:', error)
      return null
    }

    const reg = registration as any
    const qrData = `FSTIVO-${registrationId}-${reg.registration_number || ''}`

    // Generate QR code
    const qr = await generateRegistrationQRCode(
      qrData,
      reg.event?.title || 'Event'
    )

    return {
      registrationNumber: reg.registration_number || '',
      eventName: reg.event?.title || '',
      eventDate: reg.event?.start_date || '',
      eventLocation: reg.event?.venue_city || '',
      ticketType: reg.ticket_type?.name || 'Standard',
      attendeeName: reg.user?.full_name || '',
      qrCodeDataURL: qr.dataURL,
      status: reg.status,
      checkedInAt: reg.checked_in_at,
    }
  } catch (error) {
    logger.error('[Server] Failed to generate ticket QR:', error)
    throw error
  }
}

/**
 * Cancel a registration
 */
export async function cancelRegistration(
  registrationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify ownership
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('id, user_id, event_id, status')
      .eq('id', registrationId) as any

    if (fetchError || !registration) {
      return { success: false, error: 'Registration not found' }
    }

    if (registration.user_id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if event already started
    const { data: event } = await supabase
      .from('events')
      .select('start_date')
      .eq('id', registration.event_id) as any

    if (event) {
      const eventStart = new Date(event.start_date)
      if (eventStart < new Date()) {
        return { success: false, error: 'Cannot cancel registration for past event' }
      }
    }

    // Cancel registration
    const { error: updateError } = await (supabase.from('registrations') as any)
      .update({ status: 'cancelled' })
      .eq('id', registrationId)

    if (updateError) {
      return { success: false, error: 'Failed to cancel registration' }
    }

    return { success: true }
  } catch (error) {
    logger.error('[Server] Failed to cancel registration:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    full_name?: string
    avatar_url?: string
    phone?: string
    bio?: string
    location?: string
    website?: string
  }
): Promise<{ success: boolean; error?: string; profile?: any }> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and owns this profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile, error } = await (supabase.from('profiles') as any)
      .update(data)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true, profile }
  } catch (error) {
    logger.error('[Server] Failed to update user profile:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Get user's activity log
 */
export async function fetchUserActivityLog(
  userId: string,
  limit = 10
): Promise<any[]> {
  try {
    const supabase = await createClient()

    // Get recent registrations with event info
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('created_at, status, event:events(id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Transform into activity log format
    const activityLog = (registrations || []).map((r: any) => ({
      id: r.id,
      type: r.status === 'cancelled' ? 'cancellation' : 'registration',
      title: r.status === 'cancelled' ? 'Registration Cancelled' : 'Event Registered',
      description: `Registered for ${r.event?.title || 'an event'}`,
      timestamp: r.created_at,
      eventId: r.event?.id,
      eventName: r.event?.title,
    }))

    return activityLog
  } catch (error) {
    logger.error('[Server] Failed to fetch activity log:', error)
    return []
  }
}

/**
 * Get upcoming events for user
 */
export async function fetchUpcomingEvents(
  userId: string
): Promise<RegistrationWithEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, start_date, end_date, venue_city, cover_image_url, event_mode)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('event.start_date', new Date().toISOString())
      .order('event.start_date', { ascending: true })

    if (error) throw error

    return (data || []) as RegistrationWithEvent[]
  } catch (error) {
    logger.error('[Server] Failed to fetch upcoming events:', error)
    return []
  }
}
