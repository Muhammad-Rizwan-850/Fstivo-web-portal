import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { matchVolunteersToEvent } from '@/lib/ai/volunteer-matching'
import { getEventById } from '@/lib/database/queries/events'
import type { VolunteerMatch } from '@/types/api'
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    }

    const event = await getEventById(eventId)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify user is the organizer
    if (event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get available volunteers (those who haven't applied yet)
    const { data: volunteers } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'volunteer')
      .limit(50)

    if (!volunteers || volunteers.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Match volunteers using AI
    const matches = await matchVolunteersToEvent(
      {
        event_id: event.id,
        title: event.title,
        description: event.description,
        required_skills: event.required_skills || [],
        time_commitment: 'TBD',
        location: event.location?.city,
      },
      volunteers.map((v: VolunteerMatch) => ({
        id: v.id,
        full_name: v.full_name || '',
        skills: v.skills || [],
        experience: v.experience,
        bio: v.bio,
        location: v.location,
        availability: [],
      })) as any
    )

    return NextResponse.json({ matches })
  } catch (error) {
    logger.error('Volunteer matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match volunteers' },
      { status: 500 }
    )
  }
}
