// =============================================================================
// FSTIVO EVENT REMINDER CRON JOB
// =============================================================================
// Purpose: Automatically send event reminders at scheduled intervals
// Schedule: Runs every hour to check for events needing reminders
// =============================================================================
// Usage with Vercel Cron:
//   Add to vercel.json:
//   {
//     "crons": [{
//       "path": "/api/cron/event-reminders",
//       "schedule": "0 * * * *"
//     }]
//   }
// =============================================================================

import { createClient } from '@/lib/auth/config'
import { emailService } from '@/lib/emailService'
import { logger } from '@/lib/logger';

interface ReminderJob {
  registrationId: string
  reminderType: '1day' | '1hour' | '1week'
  scheduledFor: Date
}

/**
 * Main cron job handler for event reminders
 */
export async function processEventReminders() {
  const supabase = await createClient()
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  logger.info(`[${now.toISOString()}] Starting event reminder cron job`)

  try {
    // Fetch all upcoming events within the next 7 days
    const { data: events, error: eventsError } = await (supabase
      .from('events')
      .select('id, title, start_date, venue_name, venue_city')
      .gte('start_date', now.toISOString())
      .lte('start_date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_published', true) as any)

    if (eventsError) {
      logger.error('Error fetching events:', eventsError)
      return { success: false, error: 'Failed to fetch events' }
    }

    if (!events || events.length === 0) {
      logger.info('No upcoming events found in the next 7 days')
      return { success: true, processed: 0, message: 'No events to process' }
    }

    logger.info(`Found ${events.length} upcoming events`)

    const reminderJobs: ReminderJob[] = []

    // For each event, check which reminders need to be sent
    for (const event of events) {
      const eventStart = new Date(event.start_date)
      const timeUntilEvent = eventStart.getTime() - now.getTime()

      // Get all confirmed registrations for this event
      const { data: registrations } = await (supabase
        .from('registrations')
        .select('id, user:users(email, first_name, last_name)')
        .eq('event_id', event.id)
        .eq('status', 'confirmed') as any)

      if (!registrations || registrations.length === 0) continue

      // Check if 1 week reminder is needed (event is in exactly 7 days ± 1 hour)
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (Math.abs(timeUntilEvent - oneWeek) < 60 * 60 * 1000) {
        for (const reg of registrations) {
          reminderJobs.push({
            registrationId: reg.id,
            reminderType: '1week',
            scheduledFor: now,
          })
        }
      }

      // Check if 1 day reminder is needed (event is in exactly 1 day ± 1 hour)
      const oneDay = 24 * 60 * 60 * 1000
      if (Math.abs(timeUntilEvent - oneDay) < 60 * 60 * 1000) {
        for (const reg of registrations) {
          reminderJobs.push({
            registrationId: reg.id,
            reminderType: '1day',
            scheduledFor: now,
          })
        }
      }

      // Check if 1 hour reminder is needed (event is in exactly 1 hour ± 5 minutes)
      const oneHour = 60 * 60 * 1000
      if (Math.abs(timeUntilEvent - oneHour) < 5 * 60 * 1000) {
        for (const reg of registrations) {
          reminderJobs.push({
            registrationId: reg.id,
            reminderType: '1hour',
            scheduledFor: now,
          })
        }
      }
    }

    logger.info(`Found ${reminderJobs.length} reminder jobs to process`)

    // Process reminder jobs
    let sentCount = 0
    let failedCount = 0

    for (const job of reminderJobs) {
      try {
        // Fetch registration details
        const { data: registration } = await (supabase
          .from('registrations')
          .select(`
            *,
            event:events(title, start_date, venue_name, venue_city),
            user:users(email, first_name, last_name)
          `)
          .eq('id', job.registrationId)
          .single() as any)

        if (!registration || !registration.user?.email) {
          logger.info(`Skipping registration ${job.registrationId}: No user email found`)
          failedCount++
          continue
        }

        const attendeeName = registration.user?.first_name && registration.user?.last_name
          ? `${registration.user.first_name} ${registration.user.last_name}`
          : 'Attendee'

        // Send reminder email
        await emailService.sendEventReminder(registration.user.email, {
          eventName: registration.event?.title || 'Event',
          attendeeName,
          eventDate: new Date(registration.event?.start_date || '').toLocaleDateString(),
          eventTime: new Date(registration.event?.start_date || '').toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          eventLocation: `${registration.event?.venue_name || 'TBD'}${registration.event?.venue_city ? `, ${registration.event.venue_city}` : ''}`,
          reminderType: job.reminderType,
        })

        // Log that reminder was sent (in production, you'd track this in database)
        logger.info(`Sent ${job.reminderType} reminder to ${registration.user.email} for ${registration.event?.title}`)
        sentCount++
      } catch (error) {
        logger.error(`Failed to send reminder for registration ${job.registrationId}:`, error)
        failedCount++
      }
    }

    logger.info(`Cron job completed: ${sentCount} sent, ${failedCount} failed`)

    return {
      success: true,
      processed: reminderJobs.length,
      sent: sentCount,
      failed: failedCount,
      message: `Processed ${reminderJobs.length} reminders: ${sentCount} sent, ${failedCount} failed`,
    }
  } catch (error) {
    logger.error('Cron job error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send reminders for a specific event manually
 */
export async function sendEventReminders(eventId: string) {
  const supabase = await createClient()

  // Fetch event
  const { data: event, error } = await (supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as any)

  if (error || !event) {
    return { success: false, error: 'Event not found' }
  }

  // Fetch registrations
  const { data: registrations } = await (supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed') as any)

  const registrationIds = registrations?.map((r: any) => r.id) || []

  return {
    success: true,
    event: event.title,
    registrationCount: registrationIds.length,
    reminderTypes: ['1week', '1day', '1hour'],
    note: 'Reminders will be sent automatically by cron job at appropriate times',
  }
}
