import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// POST: Walk-in registration and check-in
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      event_id,
      ticket_type_id,
      station_id,
      attendee_name,
      attendee_email,
      attendee_phone,
      payment_method,
      amount_paid
    } = await request.json()

    if (!event_id || !ticket_type_id || !station_id || !attendee_name || !payment_method) {
      return NextResponse.json({
        error: 'event_id, ticket_type_id, station_id, attendee_name, and payment_method are required'
      }, { status: 400 })
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        event_id,
        ticket_type_id,
        attendee_name,
        attendee_email,
        purchase_price: amount_paid,
        status: 'active',
        purchase_method: 'walk_in'
      })
      .select()
      .single()

    if (ticketError) throw ticketError

    // Record walk-in registration
    const { data: walkin, error: walkinError } = await supabase
      .from('walkin_registrations')
      .insert({
        event_id,
        ticket_type_id,
        station_id,
        registered_by: user.id,
        attendee_name,
        attendee_email,
        attendee_phone,
        payment_method,
        amount_paid,
        ticket_id: ticket.id
      })
      .select()
      .single()

    if (walkinError) throw walkinError

    // Auto check-in
    const { data: checkin } = await supabase
      .from('checkin_records')
      .insert({
        ticket_id: ticket.id,
        station_id,
        checked_in_by: user.id,
        checkin_method: 'manual_entry',
        checkin_status: 'success'
      })
      .select()
      .single()

    // Update ticket status
    await supabase
      .from('tickets')
      .update({ status: 'checked_in' })
      .eq('id', ticket.id)

    return NextResponse.json({
      ticket,
      walkin,
      checkin,
      message: 'Walk-in registration successful!'
    })
  } catch (error: any) {
    logger.error('Error during walk-in registration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
