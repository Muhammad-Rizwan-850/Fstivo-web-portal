import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Get available bundles
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ticket_bundles')
      .select(`
        *,
        items:bundle_items(
          *,
          ticket_type:ticket_types(id, name, description)
        )
      `)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .or('starts_at.is.null,starts_at.lte.' + new Date().toISOString())
      .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())
      .order('bundle_price')

    if (error) throw error

    return NextResponse.json({ bundles: data })
  } catch (error: any) {
    logger.error('Error fetching bundles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Purchase bundle (simplified - creates tickets)
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bundle_id, quantity = 1 } = await request.json()

    if (!bundle_id) {
      return NextResponse.json({ error: 'bundle_id is required' }, { status: 400 })
    }

    // Get bundle details
    const { data: bundle, error: bundleError } = await supabase
      .from('ticket_bundles')
      .select(`
        *,
        items:bundle_items(
          *,
          ticket_type:ticket_types(*)
        )
      `)
      .eq('id', bundle_id)
      .single()

    if (bundleError || !bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    // Check availability
    if (bundle.sold_quantity + quantity > bundle.max_quantity) {
      return NextResponse.json({ error: 'Bundle sold out' }, { status: 400 })
    }

    // Create tickets for each item
    const tickets = []
    for (const item of bundle.items) {
      for (let i = 0; i < item.quantity * quantity; i++) {
        const { data: ticket } = await supabase
          .from('tickets')
          .insert({
            event_id: bundle.event_id,
            ticket_type_id: item.ticket_type_id,
            user_id: user.id,
            purchase_price: bundle.bundle_price / bundle.items.length,
            status: 'active'
          })
          .select()
          .single()

        if (ticket) tickets.push(ticket)
      }
    }

    // Update sold quantity
    await supabase
      .from('ticket_bundles')
      .update({ sold_quantity: bundle.sold_quantity + quantity })
      .eq('id', bundle_id)

    return NextResponse.json({
      tickets,
      bundle,
      totalPrice: bundle.bundle_price * quantity,
      savings: (bundle.individual_price - bundle.bundle_price) * quantity
    })
  } catch (error: any) {
    logger.error('Error purchasing bundle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
