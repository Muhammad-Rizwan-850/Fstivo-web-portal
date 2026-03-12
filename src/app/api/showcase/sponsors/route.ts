import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SponsorImpactMetricInput, SponsorTestimonialInput, SponsorStoryInput } from '@/types/api'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/showcase/sponsors
 * Fetch sponsors with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const tier = searchParams.get('tier')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('sponsors_full')
      .select('*')

    // Apply filters
    if (tier && tier !== 'all') {
      query = query.eq('tier_id', tier)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Only show active sponsors
    query = query.eq('is_active', true)

    // Order and pagination
    query = query
      .order('tier_order', { ascending: true })
      .order('display_order', { ascending: true })
      .order('events_sponsored', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: sponsors, error } = await query

    if (error) {
      logger.error('Error fetching sponsors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sponsors' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await (supabase as any).rpc('get_sponsor_stats')

    // Get sponsor tiers
    const { data: tiers } = await supabase
      .from('sponsor_tiers')
      .select('*')
      .order('display_order')

    return NextResponse.json({
      sponsors: sponsors || [],
      tiers: tiers || [],
      stats: stats || {},
      pagination: {
        limit,
        offset,
        total: sponsors?.length || 0
      }
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/showcase/sponsors
 * Create a new sponsor (Admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      tier_id,
      logo_url,
      description,
      industry,
      website,
      email,
      phone,
      location,
      since_year,
      events_sponsored,
      total_contribution_amount,
      total_contribution_display,
      is_featured,
      impact_metrics,
      testimonials,
      success_stories
    } = body

    // Validate required fields
    if (!name || !tier_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, tier_id' },
        { status: 400 }
      )
    }

    // Insert sponsor
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .insert({
        name,
        tier_id,
        logo_url,
        description,
        industry,
        website,
        email,
        phone,
        location,
        since_year,
        events_sponsored,
        total_contribution_amount,
        total_contribution_display,
        is_featured,
        is_active: true
      })
      .select()
      .single()

    if (sponsorError) {
      logger.error('Error creating sponsor:', sponsorError)
      return NextResponse.json(
        { error: 'Failed to create sponsor' },
        { status: 500 }
      )
    }

    // Insert impact metrics if provided
    if (impact_metrics && impact_metrics.length > 0) {
      const metricsData = (impact_metrics || []).map((m: SponsorImpactMetricInput, index: number) => ({
        sponsor_id: sponsor.id,
        metric_name: m.metric_name,
        metric_value: m.metric_value,
        metric_label: m.metric_label,
        display_order: index
      }))

      await (supabase as any).from('sponsor_impact_metrics').insert(metricsData)
    }

    // Insert testimonials if provided
    if (testimonials && testimonials.length > 0) {
      const testimonialsData = (testimonials || []).map((t: SponsorTestimonialInput) => ({
        sponsor_id: sponsor.id,
        testimonial_text: t.text,
        author_name: t.author,
        author_position: t.position,
        is_featured: t.is_featured || false
      }))

      await (supabase as any).from('sponsor_testimonials').insert(testimonialsData)
    }

    // Insert success stories if provided
    if (success_stories && success_stories.length > 0) {
      const storiesData = (success_stories || []).map((s: SponsorStoryInput, index: number) => ({
        sponsor_id: sponsor.id,
        title: s.title,
        achievement: s.achievement,
        details: s.details,
        story_date: s.date,
        is_featured: s.is_featured || false,
        display_order: index
      }))

      await (supabase as any).from('sponsor_success_stories').insert(storiesData)
    }

    return NextResponse.json({
      message: 'Sponsor created successfully',
      sponsor
    }, { status: 201 })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/showcase/sponsors/:id
 * Update a sponsor (Admin only)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing sponsor ID' },
        { status: 400 }
      )
    }

    // Update sponsor
    const { data: sponsor, error: sponsorError } = await supabase
      .from('sponsors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (sponsorError) {
      logger.error('Error updating sponsor:', sponsorError)
      return NextResponse.json(
        { error: 'Failed to update sponsor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Sponsor updated successfully',
      sponsor
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
