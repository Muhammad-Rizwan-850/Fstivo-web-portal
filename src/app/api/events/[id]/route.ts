import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import type { EventWithTicketTypes, TicketType } from '@/types/api'
import { logger } from '@/lib/logger';

/**
 * GET /api/events/{id}
 * Get a single event by ID with full details
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

    // Get event with category and field
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        category:event_categories(id, name, slug, icon),
        field:event_fields(id, name, slug),
        organizer:profiles(id, full_name, avatar_url, email),
        organization:organizations(id, name, logo_url)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !event) {
      logger.error('[API] Failed to fetch event:', error)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get ticket types for this event
    const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', id)
      .is('deleted_at', null)
      .order('price', { ascending: true })

    const eventData = event as EventWithTicketTypes;
    return NextResponse.json({
      event: {
        ...eventData,
        ticket_types: (ticketTypes as TicketType[]) || [],
      },
    })
  } catch (error) {
    logger.error('[API] Error in event details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
