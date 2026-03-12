/**
 * Email Templates for Fstivo Platform
 * HTML templates for transactional emails
 */

export interface EmailContext {
  appName: string
  appUrl: string
  logoUrl?: string
  primaryColor?: string
  supportEmail?: string
}

const defaultContext: EmailContext = {
  appName: 'Fstivo',
  appUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://fstivo.com',
  logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
  primaryColor: '#6366f1',
  supportEmail: 'support@fstivo.com',
}

function baseTemplate(subject: string, content: string, context: EmailContext = defaultContext): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      line-height: 1.6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-header {
      background: linear-gradient(135deg, ${context.primaryColor} 0%, #8b5cf6 100%);
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .email-logo {
      color: white;
      font-size: 28px;
      font-weight: bold;
      text-decoration: none;
    }
    .email-body {
      background-color: white;
      padding: 40px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .email-title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .email-content {
      color: #4b5563;
      font-size: 16px;
    }
    .email-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${context.primaryColor};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
    .email-footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .event-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .event-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .event-details {
      margin: 10px 0;
    }
    .event-details div {
      margin: 5px 0;
      color: #4b5563;
    }
    .event-details strong {
      color: #1f2937;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
    }
    .ticket-details {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .ticket-number {
      font-size: 20px;
      font-weight: bold;
      color: #0369a1;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <a href="${context.appUrl}" class="email-logo">${context.appName}</a>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} ${context.appName}. All rights reserved.</p>
      <p>This email was sent to {{to_email}}. If you didn't request this, please ignore it.</p>
      <p>
        <a href="${context.appUrl}/unsubscribe">Unsubscribe</a> |
        <a href="${context.appUrl}/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Registration Confirmation Email
 */
export function registrationConfirmationEmail(
  params: {
    recipientName: string
    eventTitle: string
    eventDate: string
    eventTime: string
    venue: string
    registrationNumber: string
    qrCode: string
    ticketType?: string
    amount?: number
    currency?: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Registration Confirmed: ${params.eventTitle}`

  const content = `
    <h1 class="email-title">Registration Confirmed! 🎉</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Your registration for <strong>${params.eventTitle}</strong> has been confirmed!</p>

      <div class="event-card">
        <div class="event-title">${params.eventTitle}</div>
        <div class="event-details">
          <div><strong>📅 Date:</strong> ${params.eventDate}</div>
          <div><strong>⏰ Time:</strong> ${params.eventTime}</div>
          <div><strong>📍 Location:</strong> ${params.venue}</div>
          ${params.ticketType ? `<div><strong>🎟️ Ticket:</strong> ${params.ticketType}</div>` : ''}
          ${params.amount ? `<div><strong>💰 Amount Paid:</strong> ${params.currency || 'PKR'} ${params.amount}</div>` : ''}
        </div>
      </div>

      <div class="ticket-details">
        <div style="margin-bottom: 10px; color: #6b7280; font-size: 14px;">REGISTRATION NUMBER</div>
        <div class="ticket-number">${params.registrationNumber}</div>
      </div>

      <div class="qr-code">
        <p style="margin-top: 0; color: #6b7280; font-size: 14px;">YOUR CHECK-IN QR CODE</p>
        <img src="${params.qrCode}" alt="Check-in QR Code" />
        <p style="margin: 10px 0 0 0; font-size: 14px;">Show this QR code at the venue for check-in</p>
      </div>

      <p>Please arrive at least 15 minutes before the event start time.</p>

      <a href="${context.appUrl}/dashboard/registrations" class="email-button">View My Registrations</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Payment Confirmation Email
 */
export function paymentConfirmationEmail(
  params: {
    recipientName: string
    eventTitle: string
    amount: number
    currency: string
    paymentMethod: string
    transactionId: string
    paymentDate: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Payment Confirmation: ${params.eventTitle}`

  const content = `
    <h1 class="email-title">Payment Successful! 💳</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Your payment for <strong>${params.eventTitle}</strong> has been processed successfully.</p>

      <div class="event-card">
        <div class="event-title">Payment Details</div>
        <div class="event-details">
          <div><strong>💰 Amount:</strong> ${params.currency} ${params.amount.toFixed(2)}</div>
          <div><strong>💳 Payment Method:</strong> ${params.paymentMethod}</div>
          <div><strong>🧾 Transaction ID:</strong> ${params.transactionId}</div>
          <div><strong>📅 Payment Date:</strong> ${params.paymentDate}</div>
        </div>
      </div>

      <p>A confirmation email with your ticket details will be sent shortly.</p>

      <a href="${context.appUrl}/dashboard/registrations" class="email-button">View My Registrations</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Event Reminder Email
 */
export function eventReminderEmail(
  params: {
    recipientName: string
    eventTitle: string
    eventDate: string
    eventTime: string
    venue: string
    registrationNumber: string
    daysUntil: number
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Reminder: ${params.eventTitle} ${params.daysUntil === 1 ? 'is tomorrow!' : `in ${params.daysUntil} days`}`

  const content = `
    <h1 class="email-title">Event Reminder! 🔔</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>This is a friendly reminder that <strong>${params.eventTitle}</strong> is ${params.daysUntil === 1 ? 'tomorrow' : `in ${params.daysUntil} days`}!</p>

      <div class="event-card">
        <div class="event-title">${params.eventTitle}</div>
        <div class="event-details">
          <div><strong>📅 Date:</strong> ${params.eventDate}</div>
          <div><strong>⏰ Time:</strong> ${params.eventTime}</div>
          <div><strong>📍 Location:</strong> ${params.venue}</div>
        </div>
      </div>

      <div class="ticket-details">
        <div style="margin-bottom: 10px; color: #6b7280; font-size: 14px;">REGISTRATION NUMBER</div>
        <div class="ticket-number">${params.registrationNumber}</div>
      </div>

      <p>Don't forget to bring:</p>
      <ul style="text-align: left; margin: 20px 0; padding-left: 40px;">
        <li>Your QR code (available in your dashboard)</li>
        <li>A valid ID proof</li>
        <li>Any materials you might need for the event</li>
      </ul>

      <p>Please arrive at least 15 minutes before the event start time.</p>

      <a href="${context.appUrl}/dashboard/registrations" class="email-button">View Ticket Details</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Check-in Confirmation Email
 */
export function checkInConfirmationEmail(
  params: {
    recipientName: string
    eventTitle: string
    eventDate: string
    checkInTime: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `You're Checked In: ${params.eventTitle}`

  const content = `
    <h1 class="email-title">Welcome to ${params.eventTitle}! ✅</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>You have successfully checked in to <strong>${params.eventTitle}</strong>!</p>

      <div class="event-card">
        <div class="event-title">Check-in Details</div>
        <div class="event-details">
          <div><strong>📅 Date:</strong> ${params.eventDate}</div>
          <div><strong>✅ Checked In At:</strong> ${params.checkInTime}</div>
        </div>
      </div>

      <p>We hope you have a wonderful experience!</p>

      <p>If you have any questions during the event, feel free to reach out to our volunteers or staff.</p>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Refund Confirmation Email
 */
export function refundConfirmationEmail(
  params: {
    recipientName: string
    eventTitle: string
    refundAmount: number
    currency: string
    refundReason?: string
    processingDays: number
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Refund Initiated: ${params.eventTitle}`

  const content = `
    <h1 class="email-title">Refund Initiated 💸</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Your refund for <strong>${params.eventTitle}</strong> has been initiated.</p>

      <div class="event-card">
        <div class="event-title">Refund Details</div>
        <div class="event-details">
          <div><strong>💰 Refund Amount:</strong> ${params.currency} ${params.refundAmount.toFixed(2)}</div>
          <div><strong>📅 Processing Time:</strong> ${params.processingDays} business days</div>
          ${params.refundReason ? `<div><strong>📝 Reason:</strong> ${params.refundReason}</div>` : ''}
        </div>
      </div>

      <p>The refund will be credited back to your original payment method within ${params.processingDays} business days.</p>

      <p>If you have any questions about your refund, please contact our support team.</p>

      <a href="mailto:${context.supportEmail}" class="email-button">Contact Support</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Registration Cancelled Email
 */
export function registrationCancelledEmail(
  params: {
    recipientName: string
    eventTitle: string
    cancellationDate: string
    refundStatus: 'processing' | 'not_eligible' | 'none'
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Registration Cancelled: ${params.eventTitle}`

  let refundMessage = ''
  if (params.refundStatus === 'processing') {
    refundMessage = '<p>Your refund is being processed and will be credited back to your original payment method within 5-7 business days.</p>'
  } else if (params.refundStatus === 'not_eligible') {
    refundMessage = '<p>According to our cancellation policy, this registration is not eligible for a refund.</p>'
  } else {
    refundMessage = '<p>This was a free event, so no refund is applicable.</p>'
  }

  const content = `
    <h1 class="email-title">Registration Cancelled</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Your registration for <strong>${params.eventTitle}</strong> has been cancelled.</p>

      <div class="event-card">
        <div class="event-title">Cancellation Details</div>
        <div class="event-details">
          <div><strong>📅 Cancellation Date:</strong> ${params.cancellationDate}</div>
        </div>
      </div>

      ${refundMessage}

      <p>We hope to see you at our future events!</p>

      <a href="${context.appUrl}/events" class="email-button">Browse More Events</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Welcome Email
 */
export function welcomeEmail(
  params: {
    recipientName: string
    verifyUrl: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Welcome to ${context.appName}! 🎉`

  const content = `
    <h1 class="email-title">Welcome to ${context.appName}! 🎉</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Welcome to <strong>${context.appName}</strong> - your platform for discovering and registering for amazing events!</p>

      <p>We're excited to have you on board. With ${context.appName}, you can:</p>
      <ul style="text-align: left; margin: 20px 0; padding-left: 40px;">
        <li>Discover events from conferences to workshops</li>
        <li>Register easily with secure payment options</li>
        <li>Get instant QR code tickets for check-in</li>
        <li>Receive event reminders and updates</li>
      </ul>

      <p>To get started, please verify your email address by clicking the button below:</p>

      <div style="text-align: center;">
        <a href="${params.verifyUrl}" class="email-button">Verify Email Address</a>
      </div>

      <p style="margin-top: 20px;">If you didn't create an account with ${context.appName}, please ignore this email.</p>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Password Reset Email
 */
export function passwordResetEmail(
  params: {
    recipientName: string
    resetUrl: string
    expiryHours: number
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Reset Your ${context.appName} Password`

  const content = `
    <h1 class="email-title">Reset Your Password</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>We received a request to reset your password for your ${context.appName} account.</p>

      <p>Click the button below to reset your password:</p>

      <div style="text-align: center;">
        <a href="${params.resetUrl}" class="email-button">Reset Password</a>
      </div>

      <p style="margin-top: 20px;">This link will expire in ${params.expiryHours} hours.</p>

      <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>

      <a href="mailto:${context.supportEmail}" class="email-button">Contact Support</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * Event Published Notification (for organizers)
 */
export function eventPublishedEmail(
  params: {
    recipientName: string
    eventTitle: string
    eventUrl: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `Your Event "${params.eventTitle}" is Now Live! 🚀`

  const content = `
    <h1 class="email-title">Your Event is Now Live! 🚀</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>Great news! Your event <strong>${params.eventTitle}</strong> has been published and is now visible to users.</p>

      <div class="event-card">
        <div class="event-title">${params.eventTitle}</div>
        <p>Your event is now live and ready to accept registrations!</p>
      </div>

      <p>Here's what you can do next:</p>
      <ul style="text-align: left; margin: 20px 0; padding-left: 40px;">
        <li>Share your event with your network</li>
        <li>Monitor registrations in your dashboard</li>
        <li>Respond to attendee inquiries</li>
      </ul>

      <a href="${params.eventUrl}" class="email-button">View Your Event</a>
      <a href="${context.appUrl}/dashboard/events" class="email-button" style="margin-left: 10px;">Go to Dashboard</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}

/**
 * New Registration Notification (for organizers)
 */
export function newRegistrationNotificationEmail(
  params: {
    recipientName: string
    eventTitle: string
    attendeeName: string
    attendeeEmail: string
    ticketType?: string
    amount?: number
    currency?: string
    registrationsUrl: string
  },
  context: EmailContext = defaultContext
): { subject: string; html: string } {
  const subject = `New Registration: ${params.eventTitle}`

  const content = `
    <h1 class="email-title">New Registration! 🎟️</h1>
    <div class="email-content">
      <p>Hi ${params.recipientName},</p>
      <p>You have a new registration for <strong>${params.eventTitle}</strong>!</p>

      <div class="event-card">
        <div class="event-title">Registration Details</div>
        <div class="event-details">
          <div><strong>👤 Attendee:</strong> ${params.attendeeName}</div>
          <div><strong>📧 Email:</strong> ${params.attendeeEmail}</div>
          ${params.ticketType ? `<div><strong>🎟️ Ticket:</strong> ${params.ticketType}</div>` : ''}
          ${params.amount ? `<div><strong>💰 Amount:</strong> ${params.currency || 'PKR'} ${params.amount}</div>` : ''}
        </div>
      </div>

      <a href="${params.registrationsUrl}" class="email-button">View All Registrations</a>
    </div>
  `

  return {
    subject,
    html: baseTemplate(subject, content, context),
  }
}
