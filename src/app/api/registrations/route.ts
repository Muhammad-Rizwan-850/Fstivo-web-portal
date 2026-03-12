import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { logger } from '@/lib/logger';

/**
 * GET /api/registrations
 * Get registrations with optional filtering
 * Query parameters:
 * - user_id: Filter by user ID
 * - event_id: Filter by event ID
 * - status: Filter by status (pending, confirmed, cancelled, attended)
 * - limit: Number of results (default: 50)
 * - offset: Offset for pagination (default: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = await createClient()

    let query = supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, start_date, end_date, venue, cover_image_url),
        user:profiles(id, full_name, email, avatar_url),
        ticket_type:ticket_types(id, name, price)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (eventId) {
      query = query.eq('event_id', eventId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: registrations, error, count } = await query

    if (error) {
      logger.error('[API] Failed to fetch registrations:', error)
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
    }

    return NextResponse.json({
      registrations: registrations || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    logger.error('[API] Error in registrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
