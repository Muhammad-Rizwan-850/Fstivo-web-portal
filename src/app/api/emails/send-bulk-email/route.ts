import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import type { EventWithRelations, RegistrationForEmail } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { eventId, subject, message } = await request.json()

    if (!eventId || !subject || !message) {
      return NextResponse.json(
        { error: 'Event ID, subject, and message are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch event with organizer
    const { data: event, error: eventError } = (await supabase
      .from('events')
      .select('*, organizer:organizer_id(*), users!events_organizer_id_fkey(first_name, last_name)')
      .eq('id', eventId)
      .single()) as { data: EventWithRelations | null; error: unknown }

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch all confirmed registrations for this event
    const { data: registrations, error: regError } = (await supabase
      .from('registrations')
      .select('user:users(email)')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')) as { data: RegistrationForEmail[] | null; error: unknown }

    if (regError) {
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    // Extract email addresses
    const emails = (registrations || [])
      .map((reg: RegistrationForEmail) => reg.user?.email)
      .filter((email: string | undefined) => email !== undefined && email !== null) as string[]

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'No registrants found for this event' },
        { status: 404 }
      )
    }

    const organizerName = event?.users?.first_name && event?.users?.last_name
      ? `${event.users.first_name} ${event.users.last_name}`
      : 'Event Organizer'

    // Send bulk email
    await emailService.sendBulkEmail(emails, {
      subject,
      message,
      organizerName,
      eventName: event?.title || 'Event',
    })

    return NextResponse.json({
      success: true,
      message: `Bulk email sent successfully to ${emails.length} recipients`,
      recipientCount: emails.length,
    })
  } catch (error) {
    logger.error('Error sending bulk email:', error)
    return NextResponse.json(
      { error: 'Failed to send bulk email' },
      { status: 500 }
    )
  }
}
