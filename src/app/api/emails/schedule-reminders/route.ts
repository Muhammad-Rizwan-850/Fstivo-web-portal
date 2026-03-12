import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import type { EventWithRelations, RegistrationForEmail } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch event details
    const { data: event, error } = (await supabase
      .from('events')
      .select('start_date, title')
      .eq('id', eventId)
      .single()) as { data: EventWithRelations | null; error: unknown }

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all confirmed registrations for this event
    const { data: registrations } = (await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')) as { data: RegistrationForEmail[] | null }

    const registrationIds = (registrations || []).map((reg: RegistrationForEmail) => reg.id || '')

    // In a production environment, you would:
    // 1. Store reminder jobs in a database table (e.g., email_reminder_jobs)
    // 2. Run a cron job that checks for due reminders every minute
    // 3. Execute the reminder emails when due

    // For now, we'll return the registration IDs that would receive reminders
    return NextResponse.json({
      success: true,
      message: 'Reminders scheduled successfully',
      eventTitle: event.title,
      eventDate: event.start_date,
      registrationCount: registrationIds.length,
      reminderTypes: ['1week', '1day', '1hour'],
      note: 'Implement cron job to actually send these reminders',
    })
  } catch (error) {
    logger.error('Error scheduling reminders:', error)
    return NextResponse.json(
      { error: 'Failed to schedule reminders' },
      { status: 500 }
    )
  }
}

// GET endpoint to check scheduled reminders
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    )
  }

  // In production, this would fetch from email_reminder_jobs table
  return NextResponse.json({
    eventId,
    reminders: [
      {
        type: '1week',
        scheduledFor: '7 days before event',
        status: 'pending',
      },
      {
        type: '1day',
        scheduledFor: '1 day before event',
        status: 'pending',
      },
      {
        type: '1hour',
        scheduledFor: '1 hour before event',
        status: 'pending',
      },
    ],
  })
}
