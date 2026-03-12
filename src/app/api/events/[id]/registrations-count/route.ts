import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { logger } from '@/lib/logger';

/**
 * GET /api/events/{id}/registrations-count
 * Get the total number of registrations for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Count registrations for this event (excluding cancelled)
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .neq('status', 'cancelled')

    if (error) {
      logger.error('[API] Failed to count registrations:', error)
      return NextResponse.json({ error: 'Failed to count registrations' }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    logger.error('[API] Error in registrations-count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
