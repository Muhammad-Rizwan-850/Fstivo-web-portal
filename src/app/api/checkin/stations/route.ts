import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Get check-in stations
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('checkin_stations')
      .select(`
        *,
        assigned_staff_user:auth.users!checkin_stations_assigned_staff_fkey(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('station_name')

    if (error) throw error

    // Get check-in counts for each station
    const stationsWithCounts = await Promise.all(
      (data || []).map(async (station: any) => {
        const { count } = await supabase
          .from('checkin_records')
          .select('*', { count: 'exact', head: true })
          .eq('station_id', station.id)
          .eq('checkin_status', 'success')

        return { ...station, checkin_count: count || 0 }
      })
    )

    return NextResponse.json({ stations: stationsWithCounts })
  } catch (error: any) {
    logger.error('Error fetching stations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create check-in station
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      event_id,
      station_name,
      station_type,
      location_description,
      assigned_staff,
      config
    } = await request.json()

    if (!event_id || !station_name || !station_type) {
      return NextResponse.json({ error: 'event_id, station_name, and station_type are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('checkin_stations')
      .insert({
        event_id,
        station_name,
        station_type,
        location_description,
        assigned_staff,
        config
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ station: data })
  } catch (error: any) {
    logger.error('Error creating station:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
