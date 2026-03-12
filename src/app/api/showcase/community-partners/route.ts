import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CollaborationInput, JointEventInput, ImpactMetricInput, PartnerTestimonialInput } from '@/types/api'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/showcase/community-partners
 * Fetch community partners with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const type = searchParams.get('type')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('community_partners_full')
      .select('*')

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type_id', type)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Only show active partners
    query = query.eq('is_active', true)

    // Order and pagination
    query = query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: partners, error } = await query

    if (error) {
      logger.error('Error fetching community partners:', error)
      return NextResponse.json(
        { error: 'Failed to fetch community partners' },
        { status: 500 }
      )
    }

    // Get partner types
    const { data: types } = await supabase
      .from('partner_types')
      .select('*')
      .order('display_order')

    // Get statistics
    const { data: stats } = await (supabase as any).rpc('get_community_partners_stats')

    return NextResponse.json({
      partners: partners || [],
      types: types || [],
      stats: (stats as Record<string, unknown>) || {},
      pagination: {
        limit,
        offset,
        total: partners?.length || 0
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
 * POST /api/showcase/community-partners
 * Create a new community partner (Admin only)
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
      type_id,
      logo_url,
      description,
      location,
      since_year,
      partnership_level,
      website,
      email,
      phone,
      is_featured,
      collaborations,
      joint_events,
      impact_metrics,
      testimonial
    } = body

    // Validate required fields
    if (!name || !type_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type_id' },
        { status: 400 }
      )
    }

    // Insert partner
    const { data: partner, error: partnerError } = await supabase
      .from('community_partners')
      .insert({
        name,
        type_id,
        logo_url,
        description,
        location,
        since_year,
        partnership_level,
        website,
        email,
        phone,
        is_featured,
        is_active: true
      })
      .select()
      .single()

    if (partnerError) {
      logger.error('Error creating community partner:', partnerError)
      return NextResponse.json(
        { error: 'Failed to create community partner' },
        { status: 500 }
      )
    }

    // Insert collaborations if provided
    if (collaborations && collaborations.length > 0) {
      const collaborationsData = (collaborations || []).map((c: CollaborationInput, index: number) => ({
        partner_id: partner.id,
        collaboration_text: c.text,
        display_order: index
      }))
      await (supabase as any).from('partner_collaborations').insert(collaborationsData)
    }

    // Insert joint events if provided
    if (joint_events && joint_events.length > 0) {
      const eventsData = (joint_events || []).map((e: JointEventInput) => ({
        partner_id: partner.id,
        event_name: e.name,
        event_date: e.date,
        attendees: e.attendees,
        description: e.description
      }))
      await (supabase as any).from('partner_joint_events').insert(eventsData)
    }

    // Insert impact metrics if provided
    if (impact_metrics && impact_metrics.length > 0) {
      const metricsData = (impact_metrics || []).map((m: ImpactMetricInput, index: number) => ({
        partner_id: partner.id,
        metric_name: m.name,
        metric_value: m.value,
        display_order: index
      }))
      await (supabase as any).from('partner_impact_metrics').insert(metricsData)
    }

    // Insert testimonial if provided
    if (testimonial) {
      const t = testimonial as PartnerTestimonialInput
      await (supabase as any).from('partner_testimonials').insert({
        partner_id: partner.id,
        testimonial_text: t.text,
        author_name: t.author,
        author_position: t.position,
        is_featured: t.is_featured || false
      })
    }

    return NextResponse.json({
      message: 'Community partner created successfully',
      partner
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
 * PATCH /api/showcase/community-partners
 * Update a community partner (Admin only)
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
        { error: 'Missing partner ID' },
        { status: 400 }
      )
    }

    // Update partner
    const { data: partner, error: partnerError } = await supabase
      .from('community_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (partnerError) {
      logger.error('Error updating community partner:', partnerError)
      return NextResponse.json(
        { error: 'Failed to update community partner' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Community partner updated successfully',
      partner
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
