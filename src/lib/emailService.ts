// =============================================================================
// FSTIVO EMAIL SERVICE - RESEND INTEGRATION
// =============================================================================
// Purpose: Complete email service for transactional & marketing emails
// Provider: Resend (https://resend.com)
// =============================================================================

import { Resend } from 'resend'
import { createClient } from '@/lib/auth/config'
import { logger } from '@/lib/logger';

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

class EmailService {
  private fromEmail: string

  constructor() {
    // Use your verified domain in Resend
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@fstivo.com'
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private async sendEmail(to: string[], subject: string, html: string) {
    if (!resend) {
      logger.info('📧 [MOCK] Email would be sent:', { to, subject })
      return { success: true, mock: true }
    }

    try {
      const results = []
      for (const email of to) {
        const result = await resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject,
          html,
        })
        results.push(result)
      }
      return { success: true, results }
    } catch (error) {
      logger.error('Email send error:', error)
      return { success: false, error }
    }
  }

  // ===========================================================================
  // TRANSACTIONAL EMAILS
  // ===========================================================================

  // Registration Confirmation Email
  async sendRegistrationConfirmation(
    email: string,
    data: {
      eventName: string
      registrationNumber: string
      attendeeName: string
      ticketType: string
      eventDate: string
      eventLocation: string
      eventTime: string
      amount?: number
    }
  ) {
    const subject = `Registration Confirmed: ${data.eventName}`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .details h3 { margin-top: 0; color: #667eea; }
          .details p { margin: 8px 0; }
          .registration-number { background: #667eea; color: white; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>You're all set to attend</p>
          </div>
          <div class="content">
            <p>Dear <strong>${data.attendeeName}</strong>,</p>
            <p>Congratulations! Your registration for <strong>${data.eventName}</strong> has been confirmed.</p>

            <div class="registration-number">
              Registration #: ${data.registrationNumber}
            </div>

            <div class="details">
              <h3>Event Details</h3>
              <p><strong>📅 Date:</strong> ${data.eventDate}</p>
              <p><strong>⏰ Time:</strong> ${data.eventTime}</p>
              <p><strong>📍 Location:</strong> ${data.eventLocation}</p>
              <p><strong>🎟️ Ticket Type:</strong> ${data.ticketType}</p>
              ${data.amount ? `<p><strong>💰 Amount Paid:</strong> Rs. ${data.amount.toLocaleString()}</p>` : ''}
            </div>

            <p>Please arrive at least 15 minutes before the event start time. Don't forget to bring your registration number for check-in!</p>

            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets" class="button">View My Tickets</a>
            </center>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
              <p>Need help? Contact us at support@fstivo.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Check-in Confirmation Email
  async sendCheckinConfirmation(
    email: string,
    data: {
      eventName: string
      attendeeName: string
      checkInTime: string
      registrationNumber: string
    }
  ) {
    const subject = `Checked In: ${data.eventName}`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-in Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .checkin-badge { background: #11998e; color: white; padding: 20px; border-radius: 50%; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin: 20px auto; font-size: 40px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="checkin-badge">✓</div>
            <h1>Successfully Checked In!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${data.attendeeName}</strong>,</p>
            <p>You have been successfully checked in to <strong>${data.eventName}</strong>.</p>

            <div class="details">
              <p><strong>📅 Check-in Time:</strong> ${data.checkInTime}</p>
              <p><strong>🎫 Registration #:</strong> ${data.registrationNumber}</p>
            </div>

            <p>We hope you enjoy the event! Make sure to connect with other attendees and speakers.</p>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Event Reminder Email
  async sendEventReminder(
    email: string,
    data: {
      eventName: string
      attendeeName: string
      eventDate: string
      eventTime: string
      eventLocation: string
      reminderType: '1day' | '1hour' | '1week'
    }
  ) {
    const urgencyText = {
      '1day': 'tomorrow',
      '1hour': 'in 1 hour',
      '1week': 'in one week'
    }[data.reminderType]

    const subject = `Reminder: ${data.eventName} is ${urgencyText}!`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Reminder</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Reminder!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${data.attendeeName}</strong>,</p>

            <div class="reminder-box">
              <strong>📌 Don't forget!</strong> <em>${data.eventName}</em> is happening <strong>${urgencyText}</strong>!
            </div>

            <div class="details">
              <p><strong>📅 Date:</strong> ${data.eventDate}</p>
              <p><strong>⏰ Time:</strong> ${data.eventTime}</p>
              <p><strong>📍 Location:</strong> ${data.eventLocation}</p>
            </div>

            <p>Make sure to:</p>
            <ul>
              <li>Arrive 15 minutes early</li>
              <li>Check the event schedule for any updates</li>
            </ul>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Volunteer Application Confirmation
  async sendVolunteerApplicationConfirmation(
    email: string,
    data: {
      applicantName: string
      eventName: string
      applicationDate: string
    }
  ) {
    const subject = `Volunteer Application Received: ${data.eventName}`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Volunteer Application</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Application Received!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${data.applicantName}</strong>,</p>
            <p>Thank you for your interest in volunteering for <strong>${data.eventName}</strong>!</p>

            <div class="info-box">
              <p>We've received your application on <strong>${data.applicationDate}</strong>.</p>
              <p>Our team will review your application and get back to you within 2-3 business days.</p>
            </div>

            <p>In the meantime, make sure to:</p>
            <ul>
              <li>Check your email regularly for updates</li>
              <li>Review the event details</li>
              <li>Prepare any required documentation</li>
            </ul>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Volunteer Acceptance Email
  async sendVolunteerAcceptance(
    email: string,
    data: {
      volunteerName: string
      eventName: string
      role: string
      eventDate: string
      eventLocation: string
      trainingDate?: string
    }
  ) {
    const subject = `Congratulations! You're Selected as a Volunteer`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Volunteer Acceptance</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .congrats-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>You've been selected as a volunteer</p>
          </div>
          <div class="content">
            <p>Dear <strong>${data.volunteerName}</strong>,</p>

            <div class="congrats-box">
              <strong>Great news!</strong> You've been selected to volunteer for <em>${data.eventName}</em>!
            </div>

            <div class="details">
              <p><strong>📋 Role:</strong> ${data.role}</p>
              <p><strong>📅 Event Date:</strong> ${data.eventDate}</p>
              <p><strong>📍 Location:</strong> ${data.eventLocation}</p>
              ${data.trainingDate ? `<p><strong>🎓 Training Date:</strong> ${data.trainingDate}</p>` : ''}
            </div>

            <p>Next steps:</p>
            <ol>
              <li>Confirm your participation by replying to this email</li>
              <li>Complete the volunteer orientation${data.trainingDate ? ' on ' + data.trainingDate : ''}</li>
              <li>Join our volunteer communication channel</li>
            </ol>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Payout Confirmation Email
  async sendPayoutConfirmation(
    email: string,
    data: {
      recipientName: string
      amount: number
      payoutDate: string
      paymentMethod: string
      reference: string
    }
  ) {
    const subject = `Payout Confirmation: Rs. ${data.amount.toLocaleString()}`
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: #30cfd0; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .amount-box .amount { font-size: 36px; font-weight: bold; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payout Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${data.recipientName}</strong>,</p>
            <p>Your payout has been processed successfully.</p>

            <div class="amount-box">
              <p>Amount</p>
              <div class="amount">Rs. ${data.amount.toLocaleString()}</div>
            </div>

            <div class="details">
              <p><strong>📅 Payout Date:</strong> ${data.payoutDate}</p>
              <p><strong>💳 Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>🔖 Reference:</strong> ${data.reference}</p>
            </div>

            <p>The amount should reflect in your account within 3-5 business days, depending on your bank.</p>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // ===========================================================================
  // AUTHENTICATION EMAILS
  // ===========================================================================

  // Welcome Email
  async sendWelcomeEmail(
    email: string,
    data: {
      userName: string
      verifyUrl?: string
    }
  ) {
    const subject = 'Welcome to Fstivo! 🎉'
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Fstivo</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features h3 { color: #667eea; margin-top: 0; }
          .features ul { padding-left: 20px; }
          .features li { margin: 10px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Fstivo! 🎉</h1>
            <p>Your journey to amazing events starts here</p>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p>Welcome to Fstivo - Pakistan's largest event management platform! We're thrilled to have you on board.</p>

            <div class="features">
              <h3>What can you do with Fstivo?</h3>
              <ul>
                <li>🎪 Discover amazing events near you</li>
                <li>🎟️ Register for events with just a few clicks</li>
                <li>📊 Organize your own events seamlessly</li>
                <li>🙏 Volunteer at events and earn certificates</li>
                <li>💼 Connect with industry professionals</li>
                <li>🎓 Build your resume through experiences</li>
              </ul>
            </div>

            ${data.verifyUrl ? `
              <center>
                <a href="${data.verifyUrl}" class="button">Verify Email Address</a>
              </center>
              <p style="text-align: center; font-size: 12px; color: #777;">
                Or copy and paste this link: ${data.verifyUrl}
              </p>
            ` : ''}

            <p>If you have any questions, just reply to this email. We're always here to help!</p>

            <div class="footer">
              <p>Ready to explore? Start browsing events now!</p>
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // Password Reset Email
  async sendPasswordReset(
    email: string,
    data: {
      userName: string
      resetUrl: string
      expiryTime: string
    }
  ) {
    const subject = 'Reset Your Password'
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f85032 0%, #e73827 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #f85032; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>

            <div class="warning-box">
              <strong>⚠️ This link will expire in ${data.expiryTime}</strong>
            </div>

            <p>To reset your password, click the button below:</p>

            <center>
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </center>

            <p style="font-size: 12px; color: #777; text-align: center;">
              Or copy and paste this link:<br>
              ${data.resetUrl}
            </p>

            <p>If you have any issues, contact us at support@fstivo.com</p>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail([email], subject, html)
  }

  // ===========================================================================
  // BULK EMAILS
  // ===========================================================================

  // Send bulk email to event registrants
  async sendBulkEmail(
    emails: string[],
    data: {
      subject: string
      message: string
      organizerName: string
      eventName: string
    }
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Update: ${data.eventName}</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You're receiving this email because you registered for <strong>${data.eventName}</strong>.</p>

            <div class="message">${data.message}</div>

            <p>Best regards,</p>
            <p><strong>${data.organizerName}</strong></p>
            <p>Event Organizer</p>

            <div class="footer">
              <p>This email was sent by Fstivo Event Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return await this.sendEmail(emails, data.subject, html)
  }
}

// Export singleton instance
export const emailService = new EmailService()
