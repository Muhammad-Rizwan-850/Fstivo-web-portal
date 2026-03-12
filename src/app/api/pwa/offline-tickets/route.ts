import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Get offline ticket cache
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active tickets
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_type:ticket_types(*),
        event:events(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'checked_in'])
      .gte('event.event_date', new Date().toISOString())

    if (error) throw error

    // Prepare offline cache data
    const offlineData = (tickets || []).map(ticket => ({
      ticket_id: ticket.id,
      user_id: user.id,
      ticket_data: {
        id: ticket.id,
        event_name: ticket.event?.name,
        event_date: ticket.event?.event_date,
        ticket_type: ticket.ticket_type?.name,
        attendee_name: ticket.attendee_name,
        status: ticket.status
      },
      qr_code_data: ticket.qr_code_data || `TICKET-${ticket.id}`
    }))

    // Upsert to cache
    for (const data of offlineData) {
      await supabase
        .from('offline_ticket_cache')
        .upsert(data, { onConflict: 'ticket_id,user_id' })
    }

    return NextResponse.json({ tickets: offlineData })
  } catch (error: any) {
    logger.error('Error fetching offline tickets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
