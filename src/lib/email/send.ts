/**
 * Email Sending Service using Resend API
 * Handles all transactional email sending
 */

import { ReactNode } from 'react'
import { logger } from '@/lib/logger';

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_API_URL = 'https://api.resend.com/emails'

if (!RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  logger.warn('RESEND_API_KEY is not set in production environment')
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: EmailAttachment[]
  tags?: Array<{ name: string; value: string }>
}

/**
 * Send email using Resend API
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  // Skip email sending in development if API key is not set
  if (!RESEND_API_KEY && process.env.NODE_ENV === 'development') {
    logger.info('[Email Service] Development mode - Email not sent:', {
      to: params.to,
      subject: params.subject,
    })
    return { success: true, messageId: 'dev-mode' }
  }

  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' }
  }

  const from = params.from || 'Fstivo <noreply@fstivo.com>'

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
        attachments: params.attachments,
        tags: params.tags,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('[Email Service] API Error:', data)
      return {
        success: false,
        error: data.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: data.id,
    }
  } catch (error) {
    logger.error('[Email Service] Network Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Send batch emails (up to 100 at a time with Resend)
 */
export async function sendBatchEmails(
  emails: Array<SendEmailParams>
): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}> {
  let sent = 0
  let failed = 0
  const errors: Array<{ email: string; error: string }> = []

  // Process emails in batches of 100 (Resend limit)
  const batchSize = 100

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    // Process batch in parallel with concurrency limit
    const results = await Promise.allSettled(
      batch.map((emailParams) =>
        sendEmail(emailParams).then((result) => ({
          email: Array.isArray(emailParams.to) ? emailParams.to[0] : emailParams.to,
          result,
        }))
      )
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { email, result: emailResult } = result.value
        if (emailResult.success) {
          sent++
        } else {
          failed++
          errors.push({ email, error: emailResult.error || 'Unknown error' })
        }
      } else {
        failed++
        const email = Array.isArray(batch[index].to) ? batch[index].to[0] : batch[index].to
        errors.push({
          email,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        })
      }
    })

    // Rate limiting: wait between batches if needed
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors,
  }
}

/**
 * Send email with error logging and retry
 */
export async function sendEmailWithRetry(
  params: SendEmailParams,
  maxRetries = 3,
  retryDelay = 1000
): Promise<{
  success: boolean
  messageId?: string
  attempts?: number
  error?: string
}> {
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(params)

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        attempts: attempt,
      }
    }

    lastError = result.error

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to send email after retries',
    attempts: maxRetries,
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Send test email for configuration verification
 */
export async function sendTestEmail(toEmail: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!isValidEmail(toEmail)) {
    return { success: false, error: 'Invalid email address' }
  }

  const result = await sendEmail({
    to: toEmail,
    subject: 'Test Email from Fstivo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          h1 { color: #6366f1; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Test Email Successful!</h1>
          <p>Congratulations! Your email service is configured correctly.</p>
          <p>If you received this email, your Resend integration is working properly.</p>
          <p><strong>From:</strong> Fstivo Email Service</p>
        </div>
      </body>
      </html>
    `,
    tags: [{ name: 'category', value: 'test' }],
  })

  return result
}

/**
 * Queue email for background sending (for future implementation with job queue)
 * For now, this is a placeholder that sends immediately
 */
export async function queueEmail(params: SendEmailParams): Promise<{
  success: boolean
  queued: boolean
  error?: string
}> {
  // In a future implementation, this would add to a job queue (Bull, Agenda, etc.)
  // For now, send immediately
  const result = await sendEmail(params)

  return {
    success: result.success,
    queued: false, // Not queued, sent immediately
    error: result.error,
  }
}
