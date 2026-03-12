/**
 * FSTIVO Email Notification Templates
 *
 * All email templates use FSTIVO brand colors:
 * - Primary Pink: #E94C89
 * - Magenta: #D4498E
 * - Purple: #9B4FCC
 *
 * Templates are responsive and use inline CSS for maximum email client compatibility
 */

export interface EmailTemplate {
  subject: string;
  html: string;
}

export const emailTemplates = {
  /**
   * Application Approved Email
   * Sent when a user's role application (organizer, sponsor, etc.) is approved
   */
  applicationApproved: (params: {
    userName: string;
    roleName: string;
    dashboardUrl: string;
  }): EmailTemplate => ({
    subject: `🎉 Your ${params.roleName} application has been approved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%);
              color: #ffffff;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #1a1a1a;
              margin-top: 0;
            }
            .content p {
              color: #555;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%);
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 24px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .features {
              background-color: #f9fafb;
              padding: 24px;
              border-radius: 8px;
              margin: 24px 0;
            }
            .features ul {
              margin: 0;
              padding-left: 20px;
            }
            .features li {
              margin: 8px 0;
              color: #555;
            }
            .footer {
              background-color: #f9fafb;
              padding: 24px 30px;
              text-align: center;
              color: #888;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <h2>Hi ${params.userName},</h2>
              <p>Great news! Your application for the role of <strong>${params.roleName}</strong> has been approved.</p>
              
              <div class="features">
                <p><strong>You now have access to:</strong></p>
                <ul>
                  <li>Advanced event management tools</li>
                  <li>Analytics and insights dashboard</li>
                  <li>Priority support</li>
                  <li>Exclusive ${params.roleName} features</li>
                </ul>
              </div>

              <p>Click the button below to access your dashboard and start exploring your new capabilities:</p>
              
              <div style="text-align: center;">
                <a href="${params.dashboardUrl}" class="button">Go to Dashboard</a>
              </div>

              <p>If you have any questions or need assistance, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>© 2026 FSTIVO. All rights reserved.</p>
              <p>Bringing events to life, one experience at a time.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Application Rejected Email
   * Sent when a user's role application is rejected
   */
  applicationRejected: (params: {
    userName: string;
    roleName: string;
    reason: string;
    supportEmail: string;
  }): EmailTemplate => ({
    subject: `Update on your ${params.roleName} application`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: #ffffff;
              padding: 40px 20px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .reason-box {
              background-color: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f9fafb;
              padding: 24px 30px;
              text-align: center;
              color: #888;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
            </div>
            <div class="content">
              <h2>Dear ${params.userName},</h2>
              <p>Thank you for your interest in becoming a ${params.roleName} on FSTIVO.</p>
              <p>After careful review, we regret to inform you that your application was not successful at this time.</p>
              
              <div class="reason-box">
                <strong>Reason:</strong><br>
                ${params.reason}
              </div>

              <p>We encourage you to:</p>
              <ul>
                <li>Review the feedback provided</li>
                <li>Gain more experience in the field</li>
                <li>Consider reapplying in the future</li>
              </ul>

              <p>If you have questions, please contact us at <a href="mailto:${params.supportEmail}">${params.supportEmail}</a></p>
            </div>
            <div class="footer">
              <p>© 2026 FSTIVO. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Changes Requested Email
   * Sent when changes are requested for an application
   */
  changesRequested: (params: {
    userName: string;
    roleName: string;
    changes: string;
    applicationUrl: string;
  }): EmailTemplate => ({
    subject: `📝 Changes requested for your ${params.roleName} application`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1>Changes Requested</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hi ${params.userName},</h2>
            <p>We've reviewed your ${params.roleName} application and have some feedback for you.</p>
            
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <strong>Requested Changes:</strong><br><br>
              ${params.changes}
            </div>

            <p>Please make the requested changes and resubmit your application.</p>
            
            <div style="text-align: center;">
              <a href="${params.applicationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0;">
                Update Application
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Payment Confirmation Email
   * Sent when a payment is successfully completed
   */
  paymentConfirmation: (params: {
    userName: string;
    eventTitle: string;
    amount: string;
    ticketCount: number;
    orderId: string;
    viewTicketsUrl: string;
  }): EmailTemplate => ({
    subject: `✅ Payment Confirmed - ${params.eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1>✅ Payment Successful!</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hi ${params.userName},</h2>
            <p>Great news! Your payment has been confirmed and your tickets are now active.</p>
            
            <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
              <p><strong>Event:</strong> ${params.eventTitle}</p>
              <p><strong>Amount Paid:</strong> ${params.amount} PKR</p>
              <p><strong>Tickets:</strong> ${params.ticketCount}</p>
              <p><strong>Order ID:</strong> ${params.orderId}</p>
            </div>

            <p>Your tickets are ready! You can view them anytime in your dashboard.</p>
            
            <div style="text-align: center;">
              <a href="${params.viewTicketsUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0;">
                View Your Tickets
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Payment Failed Email
   * Sent when a payment fails
   */
  paymentFailed: (params: {
    userName: string;
    eventTitle: string;
    amount: string;
    reason: string;
    retryUrl: string;
  }): EmailTemplate => ({
    subject: `❌ Payment Failed - ${params.eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; color: white; padding: 40px 20px; text-align: center;">
            <h1>❌ Payment Failed</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hi ${params.userName},</h2>
            <p>We're sorry, but your payment for <strong>${params.eventTitle}</strong> could not be processed.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <strong>Reason:</strong><br>
              ${params.reason}
            </div>

            <p><strong>Amount:</strong> ${params.amount} PKR</p>

            <p>You can try again with a different payment method.</p>
            
            <div style="text-align: center;">
              <a href="${params.retryUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0;">
                Try Again
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Event Reminder Email
   * Sent 24 hours before an event
   */
  eventReminder: (params: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    ticketUrl: string;
  }): EmailTemplate => ({
    subject: `🔔 Reminder: ${params.eventTitle} is tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1>🔔 Event Reminder</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hi ${params.userName},</h2>
            <p>Just a friendly reminder that <strong>${params.eventTitle}</strong> is happening tomorrow!</p>
            
            <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
              <p><strong>📅 Date:</strong> ${params.eventDate}</p>
              <p><strong>⏰ Time:</strong> ${params.eventTime}</p>
              <p><strong>📍 Location:</strong> ${params.eventLocation}</p>
            </div>

            <p>Don't forget to bring your ticket! You can access it from your dashboard.</p>
            
            <div style="text-align: center;">
              <a href="${params.ticketUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0;">
                View Your Ticket
              </a>
            </div>

            <p>We're excited to see you there!</p>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Registration Cancelled Email
   * Sent when a registration is cancelled
   */
  registrationCancelled: (params: {
    userName: string;
    eventTitle: string;
    refundAmount: string;
    refundDays: string;
    supportEmail: string;
  }): EmailTemplate => ({
    subject: `Registration Cancelled - ${params.eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6b7280; color: white; padding: 40px 20px; text-align: center;">
            <h1>Registration Cancelled</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hi ${params.userName},</h2>
            <p>Your registration for <strong>${params.eventTitle}</strong> has been successfully cancelled.</p>
            
            ${params.refundAmount ? `
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <strong>Refund Information:</strong><br>
                Amount: ${params.refundAmount} PKR<br>
                Expected in ${params.refundDays} business days
              </div>
            ` : ''}

            <p>We're sorry to see you go. If you have any questions or if there's anything we can help you with, please don't hesitate to reach out.</p>
            
            <p>Support: <a href="mailto:${params.supportEmail}">${params.supportEmail}</a></p>
          </div>
        </body>
      </html>
    `,
  }),
};
