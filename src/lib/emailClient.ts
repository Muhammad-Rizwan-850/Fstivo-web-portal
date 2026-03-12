import { logger } from '@/lib/logger';
// =============================================================================
// FSTIVO EMAIL CLIENT - FRONTEND UTILITIES
// =============================================================================
// Purpose: Utility functions for triggering emails from the frontend
// =============================================================================

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmationEmail(registrationId: string) {
  try {
    const response = await fetch('/api/emails/send-registration-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending registration confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send check-in confirmation email
 */
export async function sendCheckinConfirmationEmail(registrationId: string) {
  try {
    const response = await fetch('/api/emails/send-checkin-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending check-in confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send event reminder (1 day, 1 hour, or 1 week before)
 */
export async function sendEventReminderEmail(
  registrationId: string,
  reminderType: '1day' | '1hour' | '1week'
) {
  try {
    const response = await fetch('/api/emails/send-event-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, reminderType }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending event reminder:', error)
    return { success: false, error }
  }
}

/**
 * Send bulk email to event registrants
 */
export async function sendBulkEmailToRegistrants(data: {
  eventId: string
  subject: string
  message: string
}) {
  try {
    const response = await fetch('/api/emails/send-bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    logger.error('Error sending bulk email:', error)
    return { success: false, error }
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmailUser(email: string, userName: string) {
  try {
    const response = await fetch('/api/emails/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const response = await fetch('/api/emails/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetToken }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending password reset:', error)
    return { success: false, error }
  }
}

/**
 * Send volunteer application confirmation
 */
export async function sendVolunteerApplicationConfirmationEmail(applicationId: string) {
  try {
    const response = await fetch('/api/emails/send-volunteer-application-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending volunteer application confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send volunteer acceptance email
 */
export async function sendVolunteerAcceptanceEmail(applicationId: string) {
  try {
    const response = await fetch('/api/emails/send-volunteer-acceptance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending volunteer acceptance:', error)
    return { success: false, error }
  }
}

/**
 * Send payout confirmation email
 */
export async function sendPayoutConfirmationEmail(payoutId: string) {
  try {
    const response = await fetch('/api/emails/send-payout-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutId }),
    })

    if (!response.ok) throw new Error('Failed to send email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending payout confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send test email (for development/testing)
 */
export async function sendTestEmail(email: string) {
  try {
    const response = await fetch('/api/emails/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) throw new Error('Failed to send test email')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error sending test email:', error)
    return { success: false, error }
  }
}

/**
 * Get email delivery status
 */
export async function getEmailDeliveryStatus(emailId: string) {
  try {
    const response = await fetch(`/api/emails/status/${emailId}`)

    if (!response.ok) throw new Error('Failed to fetch email status')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error fetching email status:', error)
    return { success: false, error }
  }
}

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
  try {
    const response = await fetch('/api/emails/templates')

    if (!response.ok) throw new Error('Failed to fetch templates')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error fetching email templates:', error)
    return { success: false, error }
  }
}

/**
 * Schedule event reminders (cron job)
 */
export async function scheduleEventReminders(eventId: string) {
  try {
    const response = await fetch('/api/emails/schedule-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })

    if (!response.ok) throw new Error('Failed to schedule reminders')

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    logger.error('Error scheduling reminders:', error)
    return { success: false, error }
  }
}

// Export all functions as a named export
export const emailClient = {
  sendRegistrationConfirmation: sendRegistrationConfirmationEmail,
  sendCheckinConfirmation: sendCheckinConfirmationEmail,
  sendEventReminder: sendEventReminderEmail,
  sendBulkEmail: sendBulkEmailToRegistrants,
  sendWelcome: sendWelcomeEmailUser,
  sendPasswordReset: sendPasswordResetEmail,
  sendVolunteerApplicationConfirmation: sendVolunteerApplicationConfirmationEmail,
  sendVolunteerAcceptance: sendVolunteerAcceptanceEmail,
  sendPayoutConfirmation: sendPayoutConfirmationEmail,
  sendTest: sendTestEmail,
  getStatus: getEmailDeliveryStatus,
  getTemplates: getEmailTemplates,
  scheduleReminders: scheduleEventReminders,
}
