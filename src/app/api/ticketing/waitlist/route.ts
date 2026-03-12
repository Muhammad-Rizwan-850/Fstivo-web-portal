import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Get waitlist status
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('waitlist')
      .select(`
        *,
        event:events(id, name, event_date),
        ticket_type:ticket_types(id, name, price)
      `)
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'waiting')
      .order('position')

    if (error) throw error

    return NextResponse.json({ waitlist: data })
  } catch (error: any) {
    logger.error('Error fetching waitlist:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Join waitlist
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event_id, ticket_type_id, quantity = 1, email, phone } = await request.json()

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', event_id)
      .eq('status', 'waiting')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already on waitlist' }, { status: 400 })
    }

    // Get current max position
    const { data: maxPosition } = await supabase
      .from('waitlist')
      .select('position')
      .eq('event_id', event_id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const position = (maxPosition?.position || 0) + 1

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        event_id,
        ticket_type_id,
        user_id: user.id,
        email: email || user.email,
        phone,
        quantity,
        position,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Send notification (if table exists)
    try {
      await (supabase as any).from('notifications').insert({
        user_id: user.id,
        type: 'waitlist_joined',
        title: 'Joined Waitlist',
        message: `You're #${position} on the waitlist. We'll notify you if tickets become available.`,
        data: { waitlist_id: data.id }
      })
    } catch (e) {
      logger.info('Notification not sent:', e)
    }

    return NextResponse.json({ waitlist: data })
  } catch (error: any) {
    logger.error('Error joining waitlist:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
