import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { RegistrationWithRelations } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch registration with all related data
    const { data: registration, error } = (await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
        ticket_type:ticket_types(*),
        user:users(email, first_name, last_name)
      `)
      .eq('id', registrationId)
      .single()) as { data: RegistrationWithRelations | null; error: unknown }

    if (error || !registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    const userEmail = registration.user?.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    const attendeeName = registration.user?.first_name && registration.user?.last_name
      ? `${registration.user.first_name} ${registration.user.last_name}`
      : 'Attendee'

    // Send email
    await emailService.sendRegistrationConfirmation(userEmail, {
      eventName: registration.event?.title || 'Event',
      registrationNumber: registration.registration_number || 'N/A',
      attendeeName,
      ticketType: registration.ticket_type?.name || 'General',
      eventDate: registration.event?.start_date ? new Date(registration.event.start_date).toLocaleDateString() : '',
      eventTime: registration.event?.start_date ? new Date(registration.event.start_date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
      eventLocation: `${registration.event?.venue_name || 'TBD'}${registration.event?.venue_city ? `, ${registration.event.venue_city}` : ''}`,
      amount: registration.total_amount || undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Registration confirmation email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending registration confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send registration confirmation email' },
      { status: 500 }
    )
  }
}
