import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { PastEventInput, GalleryImage, TestimonialInput } from '@/types/api'
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('past_events_showcase_full')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (year && year !== 'all') {
      query = query.eq('year', parseInt(year))
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: events, error, count } = await query

    if (error) {
      logger.error('Error fetching past events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch past events' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: statsData } = await (supabase as any).rpc('get_past_events_stats')
    const stats = statsData || {
      total_events: 0,
      total_attendees: 0,
      average_rating: 0,
      total_testimonials: 0
    }

    return NextResponse.json({
      events: events || [],
      stats,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
  } catch (error) {
    logger.error('Error in past events API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = (await request.json()) as PastEventInput

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Extract data from request body
    const {
      event_id,
      title,
      description,
      date,
      year,
      location,
      category,
      attendees_count,
      rating,
      featured_image,
      video_url,
      highlights,
      is_featured,
      gallery_images,
      testimonials
    } = body

    // Create past event
    const { data: event, error: eventError } = await supabase
      .from('past_events_showcase')
      .insert({
        event_id,
        title,
        description,
        date,
        year,
        location,
        category,
        attendees_count,
        rating,
        featured_image,
        video_url,
        highlights,
        is_featured: is_featured || false
      })
      .select()
      .single()

    if (eventError) {
      logger.error('Error creating past event:', eventError)
      return NextResponse.json(
        { error: 'Failed to create past event' },
        { status: 500 }
      )
    }

    // Add gallery images
    if (body.gallery_images && body.gallery_images.length > 0) {
      const galleryData = (body.gallery_images || []).map((img: GalleryImage, idx: number) => ({
        showcase_event_id: event.id,
        image_url: img.url,
        caption: img.caption,
        display_order: idx
      }))

      const { error: galleryError } = await supabase
        .from('event_gallery')
        .insert(galleryData)

      if (galleryError) {
        logger.error('Error adding gallery images:', galleryError)
      }
    }

    // Add testimonials
    if (body.testimonials && body.testimonials.length > 0) {
      const testimonialData = (body.testimonials || []).map((t: TestimonialInput, idx: number) => ({
        showcase_event_id: event.id,
        attendee_name: t.name,
        attendee_role: t.role,
        attendee_university: t.university,
        testimonial_text: t.text,
        rating: t.rating,
        is_featured: t.is_featured || false,
        display_order: idx
      }))

      const { error: testimonialError } = await supabase
        .from('event_testimonials')
        .insert(testimonialData)

      if (testimonialError) {
        logger.error('Error adding testimonials:', testimonialError)
      }
    }

    return NextResponse.json({
      success: true,
      event,
      message: 'Past event created successfully'
    }, { status: 201 })

  } catch (error) {
    logger.error('Error in POST past events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
