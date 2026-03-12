import { NextRequest, NextResponse } from 'next/server'
import { processEventReminders } from '@/lib/cron/eventReminderCron'
import { logger } from '@/lib/logger';

/**
 * Cron Job Endpoint for Event Reminders
 *
 * This endpoint should be called by:
 * 1. Vercel Cron Jobs (recommended)
 * 2. External cron services (cron-job.org, EasyCron, etc.)
 * 3. Manual triggers for testing
 *
 * Schedule: Run every hour (0 * * * *)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check query parameter for compatibility
    const url = new URL(request.url)
    const secretParam = url.searchParams.get('secret')

    if (secretParam !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  logger.info('Cron job triggered: processEventReminders')

  try {
    const result = await processEventReminders()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      cron: 'event-reminders',
    })
  } catch (error) {
    logger.error('Cron job execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger via POST for testing
 */
export async function POST(request: NextRequest) {
  try {
    const result = await processEventReminders()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      triggeredBy: 'manual',
    })
  } catch (error) {
    logger.error('Manual trigger error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
