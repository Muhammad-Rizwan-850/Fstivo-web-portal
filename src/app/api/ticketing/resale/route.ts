import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Browse resale tickets
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    const { data, error } = await supabase
      .from('ticket_resales')
      .select(`
        *,
        ticket:tickets(
          *,
          ticket_type:ticket_types(name, description)
        )
      `)
      .eq('status', 'listed')
      .gte('expires_at', new Date().toISOString())
      .order('asking_price')

    if (error) throw error

    let filtered = data
    if (eventId && filtered) {
      filtered = filtered.filter((r: any) => r.ticket.event_id === eventId)
    }

    return NextResponse.json({ listings: filtered || [] })
  } catch (error: any) {
    logger.error('Error fetching resale listings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: List ticket for resale
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticket_id, asking_price } = await request.json()

    if (!ticket_id || !asking_price) {
      return NextResponse.json({ error: 'ticket_id and asking_price are required' }, { status: 400 })
    }

    // Verify ticket ownership
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, ticket_type:ticket_types(*)')
      .eq('id', ticket_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found or invalid' }, { status: 400 })
    }

    // Platform fee (5%)
    const platformFee = Number(asking_price) * 0.05

    const { data, error } = await supabase
      .from('ticket_resales')
      .insert({
        ticket_id,
        seller_user_id: user.id,
        original_price: ticket.purchase_price,
        asking_price,
        platform_fee: platformFee,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single()

    if (error) throw error

    // Mark ticket as listed for resale
    await supabase
      .from('tickets')
      .update({ status: 'listed_for_resale' })
      .eq('id', ticket_id)

    return NextResponse.json({ listing: data })
  } catch (error: any) {
    logger.error('Error listing ticket for resale:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
