/**
 * Email Service Index
 * Central exports for all email functionality
 */

// Email sending functions
export {
  sendEmail,
  sendBatchEmails,
  sendEmailWithRetry,
  queueEmail,
  sendTestEmail,
  isValidEmail,
  type SendEmailParams,
  type EmailAttachment,
} from './send'

// Email templates
export {
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
  type EmailContext,
} from './templates'

// Email server actions
export {
  sendRegistrationConfirmationEmailAction,
  sendPaymentConfirmationEmailAction,
  sendEventReminderEmailAction,
  sendEventRemindersBatchAction,
  sendCheckInConfirmationEmailAction,
  sendRefundConfirmationEmailAction,
  sendRegistrationCancelledEmailAction,
  sendNewRegistrationNotificationAction,
  sendWelcomeEmailAction,
  sendPasswordResetEmailAction,
  sendTestEmailAction,
} from '../actions/email-server'
