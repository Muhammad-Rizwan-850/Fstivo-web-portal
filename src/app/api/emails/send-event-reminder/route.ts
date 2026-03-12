import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { RegistrationWithRelations } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { registrationId, reminderType } = await request.json()

    if (!registrationId || !reminderType) {
      return NextResponse.json(
        { error: 'Registration ID and reminder type are required' },
        { status: 400 }
      )
    }

    if (!['1day', '1hour', '1week'].includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid reminder type. Must be 1day, 1hour, or 1week' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch registration with event data
    const { data: registration, error } = (await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
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
    await emailService.sendEventReminder(userEmail, {
      eventName: registration.event?.title || 'Event',
      attendeeName,
      eventDate: new Date(registration.event?.start_date || '').toLocaleDateString(),
      eventTime: new Date(registration.event?.start_date || '').toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      eventLocation: `${registration.event?.venue_name || 'TBD'}${registration.event?.venue_city ? `, ${registration.event.venue_city}` : ''}`,
      reminderType: reminderType as '1day' | '1hour' | '1week',
    })

    return NextResponse.json({
      success: true,
      message: 'Event reminder email sent successfully',
    })
  } catch (error) {
    logger.error('Error sending event reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send event reminder email' },
      { status: 500 }
    )
  }
}
