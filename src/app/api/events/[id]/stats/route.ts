import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import type { RegistrationRecord } from '@/types/api'
import { logger } from '@/lib/logger';

/**
 * GET /api/events/{id}/stats
 * Get comprehensive statistics for an event
 * Returns:
 * - total_registrations: Total number of registrations
 * - total_checked_in: Number of attendees checked in
 * - check_in_rate: Percentage of checked-in attendees
 * - confirmed_registrations: Number of confirmed registrations
 * - pending_registrations: Number of pending registrations
 * - cancelled_registrations: Number of cancelled registrations
 * - total_revenue: Total revenue from paid registrations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all registrations for this event
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('status, checked_in_at, payment_status, amount_paid')
      .eq('event_id', id)

    if (error) {
      logger.error('[API] Failed to fetch event stats:', error)
      return NextResponse.json({ error: 'Failed to fetch event stats' }, { status: 500 })
    }

    // Cast registrations to typed array
    const typedRegistrations = (registrations || []) as RegistrationRecord[]

    // Calculate statistics
    const totalRegistrations = typedRegistrations.length || 0
    const totalCheckedIn = typedRegistrations.filter((r: RegistrationRecord) => r.checked_in_at).length || 0
    const confirmedRegistrations = typedRegistrations.filter((r: RegistrationRecord) => r.status === 'confirmed').length || 0
    const pendingRegistrations = typedRegistrations.filter((r: RegistrationRecord) => r.status === 'pending').length || 0
    const cancelledRegistrations = typedRegistrations.filter((r: RegistrationRecord) => r.status === 'cancelled').length || 0
    const totalRevenue = typedRegistrations.reduce((sum: number, r: RegistrationRecord) => sum + (r.amount_paid || 0), 0) || 0

    const checkInRate = totalRegistrations > 0
      ? (totalCheckedIn / totalRegistrations) * 100
      : 0

    return NextResponse.json({
      stats: {
        total_registrations: totalRegistrations,
        total_checked_in: totalCheckedIn,
        check_in_rate: Math.round(checkInRate * 10) / 10,
        confirmed_registrations: confirmedRegistrations,
        pending_registrations: pendingRegistrations,
        cancelled_registrations: cancelledRegistrations,
        total_revenue: totalRevenue,
      },
    })
  } catch (error) {
    logger.error('[API] Error in event stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
