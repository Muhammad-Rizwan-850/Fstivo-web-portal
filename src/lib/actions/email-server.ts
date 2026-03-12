'use server'

import { createClient } from '@/lib/auth/config'
import {
  sendEmail,
  sendEmailWithRetry,
  sendBatchEmails,
  queueEmail,
} from '@/lib/email/send'
import {
  registrationConfirmationEmail,
  paymentConfirmationEmail,
  eventReminderEmail,
  checkInConfirmationEmail,
  refundConfirmationEmail,
  registrationCancelledEmail,
  welcomeEmail,
  passwordResetEmail,
  eventPublishedEmail,
  newRegistrationNotificationEmail,
} from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger';

// ============================================================================
// EMAIL SERVER ACTIONS
// ============================================================================

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmationEmailAction(registrationId: string) {
  const supabase = await createClient()

  try {
    // Get registration with all related data
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, start_date, end_date, venue_name, venue_city, venue_address, is_virtual, virtual_meeting_link),
        ticket_type:ticket_type_id(id, name, price)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    const user = registration.user
    const event = registration.event

    // Format event date and time
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)
    const eventDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const eventTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Format venue
    const venue = event.is_virtual
      ? `Virtual Event ${event.virtual_meeting_link ? `(${event.virtual_meeting_link})` : ''}`
      : `${event.venue_name}${event.venue_city ? `, ${event.venue_city}` : ''}`

    // Generate QR code URL (you may want to use a QR code generation service)
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/qr/${registration.qr_code}`

    // Get email template
    const emailTemplate = registrationConfirmationEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      eventDate,
      eventTime,
      venue,
      registrationNumber: registration.registration_number,
      qrCode: qrCodeUrl,
      ticketType: registration.ticket_type?.name,
      amount: registration.payment_amount || undefined,
      currency: event.currency || 'PKR',
    })

    // Send email
    const result = await sendEmailWithRetry({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'registration_confirmation' },
        { name: 'event_id', value: event.id },
        { name: 'registration_id', value: registrationId },
      ],
    })

    if (result.success) {
      // Update registration to mark email as sent
      await (supabase.from('registrations') as any)
        .update({
          custom_answers: {
            ...(registration.custom_answers || {}),
            confirmation_email_sent: true,
            confirmation_email_sent_at: new Date().toISOString(),
            confirmation_email_message_id: result.messageId,
          },
        })
        .eq('id', registrationId)

      return { success: true, messageId: result.messageId }
    } else {
      return { error: result.error || 'Failed to send email' }
    }
  } catch (error) {
    logger.error('[Email] Registration confirmation error:', error)
    return { error: 'Failed to send confirmation email' }
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmailAction(registrationId: string) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, currency)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    if (registration.payment_status !== 'paid') {
      return { error: 'Payment not completed' }
    }

    const user = registration.user
    const event = registration.event

    // Format payment date
    const paymentDate = registration.payment_date
      ? new Date(registration.payment_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

    // Format payment method
    const paymentMethodNames: Record<string, string> = {
      stripe: 'Credit/Debit Card',
      jazzcash: 'JazzCash',
      easypaisa: 'Easypaisa',
      bank_transfer: 'Bank Transfer',
    }
    const paymentMethod = paymentMethodNames[registration.payment_method || ''] || registration.payment_method || 'Online Payment'

    const emailTemplate = paymentConfirmationEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      amount: registration.payment_amount || 0,
      currency: event.currency || 'PKR',
      paymentMethod,
      transactionId: registration.payment_id || 'N/A',
      paymentDate,
    })

    const result = await sendEmailWithRetry({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'payment_confirmation' },
        { name: 'event_id', value: event.id },
        { name: 'registration_id', value: registrationId },
      ],
    })

    if (result.success) {
      await (supabase.from('registrations') as any)
        .update({
          custom_answers: {
            ...(registration.custom_answers || {}),
            payment_email_sent: true,
            payment_email_sent_at: new Date().toISOString(),
          },
        })
        .eq('id', registrationId)
    }

    return { success: result.success, messageId: result.messageId, error: result.error }
  } catch (error) {
    logger.error('[Email] Payment confirmation error:', error)
    return { error: 'Failed to send payment confirmation email' }
  }
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmailAction(registrationId: string) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, start_date, venue_name, venue_city, venue_address, is_virtual)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    const user = registration.user
    const event = registration.event

    // Calculate days until event
    const eventDate = new Date(event.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) {
      return { error: 'Event has already passed' }
    }

    const eventDateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const eventTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const venue = event.is_virtual
      ? 'Virtual Event'
      : `${event.venue_name}${event.venue_city ? `, ${event.venue_city}` : ''}`

    const emailTemplate = eventReminderEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      eventDate: eventDateStr,
      eventTime,
      venue,
      registrationNumber: registration.registration_number,
      daysUntil,
    })

    const result = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'event_reminder' },
        { name: 'event_id', value: event.id },
        { name: 'days_until', value: daysUntil.toString() },
      ],
    })

    return { success: result.success, messageId: result.messageId, error: result.error }
  } catch (error) {
    logger.error('[Email] Event reminder error:', error)
    return { error: 'Failed to send reminder email' }
  }
}

/**
 * Send event reminders to all confirmed attendees
 * This would typically be called by a cron job
 */
export async function sendEventRemindersBatchAction(eventId: string, daysBefore: number) {
  const supabase = await createClient()

  try {
    // Get all confirmed registrations for the event
    const { data: registrations, error } = await (supabase.from('registrations') as any)
      .select(`
        id,
        user:user_id(id, email, full_name),
        event:event_id(id, title, start_date, venue_name, venue_city, is_virtual)
      `)
      .eq('event_id', eventId)
      .eq('status', 'confirmed')
      .neq('status', 'cancelled')

    if (error || !registrations || registrations.length === 0) {
      return { error: 'No registrations found', sent: 0, failed: 0 }
    }

    // Prepare batch emails
    const emails = registrations.map((reg: any) => {
      const eventDate = new Date(reg.event.start_date)
      const eventDateStr = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const eventTime = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const venue = reg.event.is_virtual
        ? 'Virtual Event'
        : `${reg.event.venue_name}${reg.event.venue_city ? `, ${reg.event.venue_city}` : ''}`

      const emailTemplate = eventReminderEmail({
        recipientName: reg.user.full_name || 'there',
        eventTitle: reg.event.title,
        eventDate: eventDateStr,
        eventTime,
        venue,
        registrationNumber: reg.registration_number || '',
        daysUntil: daysBefore,
      })

      return {
        to: reg.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        tags: [
          { name: 'category', value: 'event_reminder' },
          { name: 'event_id', value: eventId },
          { name: 'days_before', value: daysBefore.toString() },
        ],
      }
    })

    // Send batch emails
    const result = await sendBatchEmails(emails)

    return {
      success: result.failed === 0,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    }
  } catch (error) {
    logger.error('[Email] Batch reminder error:', error)
    return { error: 'Failed to send batch reminders', sent: 0, failed: 0 }
  }
}

/**
 * Send check-in confirmation email
 */
export async function sendCheckInConfirmationEmailAction(registrationId: string) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, start_date)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    if (!registration.checked_in_at) {
      return { error: 'Attendee not checked in' }
    }

    const user = registration.user
    const event = registration.event

    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const checkInTime = new Date(registration.checked_in_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const emailTemplate = checkInConfirmationEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      eventDate,
      checkInTime,
    })

    const result = await queueEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'check_in_confirmation' },
        { name: 'event_id', value: event.id },
      ],
    })

    return { success: result.success, error: result.error }
  } catch (error) {
    logger.error('[Email] Check-in confirmation error:', error)
    return { error: 'Failed to send check-in confirmation email' }
  }
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmailAction(
  registrationId: string,
  refundReason?: string
) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, currency)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    if (registration.payment_status !== 'refunded') {
      return { error: 'Payment not refunded' }
    }

    const user = registration.user
    const event = registration.event

    // Get refund reason from custom_answers if not provided
    const reason = refundReason || registration.custom_answers?.refund_reason

    const emailTemplate = refundConfirmationEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      refundAmount: registration.payment_amount || 0,
      currency: event.currency || 'PKR',
      refundReason: reason,
      processingDays: 7,
    })

    const result = await queueEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'refund_confirmation' },
        { name: 'event_id', value: event.id },
      ],
    })

    return { success: result.success, error: result.error }
  } catch (error) {
    logger.error('[Email] Refund confirmation error:', error)
    return { error: 'Failed to send refund confirmation email' }
  }
}

/**
 * Send registration cancelled email
 */
export async function sendRegistrationCancelledEmailAction(registrationId: string) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        user:user_id(id, email, full_name),
        event:event_id(id, title, start_date)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    if (registration.status !== 'cancelled') {
      return { error: 'Registration not cancelled' }
    }

    const user = registration.user
    const event = registration.event

    const cancellationDate = registration.cancelled_at
      ? new Date(registration.cancelled_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

    // Determine refund status
    let refundStatus: 'processing' | 'not_eligible' | 'none' = 'none'
    if (registration.payment_status === 'refunded') {
      refundStatus = 'processing'
    } else if (registration.payment_amount && registration.payment_amount > 0) {
      refundStatus = 'not_eligible'
    }

    const emailTemplate = registrationCancelledEmail({
      recipientName: user.full_name || 'there',
      eventTitle: event.title,
      cancellationDate,
      refundStatus,
    })

    const result = await queueEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'cancellation_notice' },
        { name: 'event_id', value: event.id },
      ],
    })

    return { success: result.success, error: result.error }
  } catch (error) {
    logger.error('[Email] Cancellation notice error:', error)
    return { error: 'Failed to send cancellation email' }
  }
}

/**
 * Send new registration notification to organizer
 */
export async function sendNewRegistrationNotificationAction(registrationId: string) {
  const supabase = await createClient()

  try {
    const { data: registration, error } = await (supabase.from('registrations') as any)
      .select(`
        *,
        event:event_id(id, title, organizer_id, currency),
        attendee:user_id(id, email, full_name)
      `)
      .eq('id', registrationId)
      .single()

    if (error || !registration) {
      return { error: 'Registration not found' }
    }

    const event = registration.event

    // Get organizer's email
    const { data: organizer } = await (supabase.from('profiles') as any)
      .select('email, full_name')
      .eq('id', event.organizer_id)
      .single()

    if (!organizer) {
      return { error: 'Organizer not found' }
    }

    const emailTemplate = newRegistrationNotificationEmail({
      recipientName: organizer.full_name || 'Organizer',
      eventTitle: event.title,
      attendeeName: registration.attendee.full_name || 'Attendee',
      attendeeEmail: registration.attendee.email,
      ticketType: registration.ticket_type_id ? 'Standard' : undefined, // You might want to fetch actual ticket name
      amount: registration.payment_amount || undefined,
      currency: event.currency || 'PKR',
      registrationsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/events/${event.id}/registrations`,
    })

    const result = await queueEmail({
      to: organizer.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [
        { name: 'category', value: 'new_registration' },
        { name: 'event_id', value: event.id },
      ],
    })

    return { success: result.success, error: result.error }
  } catch (error) {
    logger.error('[Email] New registration notification error:', error)
    return { error: 'Failed to send notification email' }
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmailAction(email: string, name: string, verifyUrl: string) {
  try {
    const emailTemplate = welcomeEmail({
      recipientName: name,
      verifyUrl,
    })

    const result = await sendEmailWithRetry({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [{ name: 'category', value: 'welcome' }],
    })

    return { success: result.success, messageId: result.messageId, error: result.error }
  } catch (error) {
    logger.error('[Email] Welcome email error:', error)
    return { error: 'Failed to send welcome email' }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmailAction(email: string, name: string, resetUrl: string) {
  try {
    const emailTemplate = passwordResetEmail({
      recipientName: name,
      resetUrl,
      expiryHours: 1,
    })

    const result = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      tags: [{ name: 'category', value: 'password_reset' }],
    })

    return { success: result.success, messageId: result.messageId, error: result.error }
  } catch (error) {
    logger.error('[Email] Password reset error:', error)
    return { error: 'Failed to send password reset email' }
  }
}

/**
 * Send test email for configuration verification
 */
export async function sendTestEmailAction(email: string) {
  try {
    const { sendTestEmail } = await import('@/lib/email/send')
    const result = await sendTestEmail(email)
    return result
  } catch (error) {
    logger.error('[Email] Test email error:', error)
    return { error: 'Failed to send test email' }
  }
}
