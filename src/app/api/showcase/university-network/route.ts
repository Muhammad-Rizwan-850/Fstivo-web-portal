import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UniversityCampusInput, UniversityAchievementInput, StudentOrgInput } from '@/types/api'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/showcase/university-network
 * Fetch universities with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const city = searchParams.get('city')
    const tier = searchParams.get('tier')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('universities_full')
      .select('*')

    // Apply filters
    if (city && city !== 'all') {
      query = query.eq('city', city)
    }

    if (tier && tier !== 'all') {
      query = query.eq('tier_id', tier)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Only show active universities
    query = query.eq('is_active', true)

    // Order by rank and pagination
    query = query
      .order('rank', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: universities, error } = await query

    if (error) {
      logger.error('Error fetching universities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch universities' },
        { status: 500 }
      )
    }

    // Get university tiers
    const { data: tiers } = await supabase
      .from('university_tiers')
      .select('*')
      .order('display_order')

    // Get statistics
    const { data: stats } = await (supabase as any).rpc('get_university_network_stats')

    // Get featured competitions
    const { data: competitions } = await supabase
      .from('inter_university_competitions')
      .select(`
        *,
        university:universities!winner_university_id(name)
      `)
      .eq('is_featured', true)
      .order('competition_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      universities: universities || [],
      tiers: tiers || [],
      stats: (stats as Record<string, unknown>) || {},
      competitions: competitions || [],
      pagination: {
        limit,
        offset,
        total: universities?.length || 0
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
 * POST /api/showcase/university-network
 * Create a new university (Admin only)
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
      full_name,
      city,
      logo_url,
      tier_id,
      students_active,
      events_hosted,
      ambassadors_count,
      total_attendance,
      rating,
      joined_date,
      is_featured,
      campuses,
      achievements,
      student_orgs
    } = body

    // Validate required fields
    if (!name || !city || !joined_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, joined_date' },
        { status: 400 }
      )
    }

    // Insert university
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .insert({
        name,
        full_name,
        city,
        logo_url,
        tier_id,
        students_active,
        events_hosted,
        ambassadors_count,
        total_attendance,
        rating,
        joined_date,
        is_featured,
        is_active: true
      })
      .select()
      .single()

    if (universityError) {
      logger.error('Error creating university:', universityError)
      return NextResponse.json(
        { error: 'Failed to create university' },
        { status: 500 }
      )
    }

    // Insert campuses if provided
    if (campuses && campuses.length > 0) {
      const campusesData = (campuses || []).map((campus: UniversityCampusInput | string) => {
        const camp = typeof campus === 'string' ? { campus_city: campus } : campus
        return {
          university_id: university.id,
          campus_city: camp.campus_city
        }
      })
      await (supabase as any).from('university_campuses').insert(campusesData)
    }

    // Insert achievements if provided
    if (achievements && achievements.length > 0) {
      const achievementsData = (achievements || []).map((a: UniversityAchievementInput, index: number) => ({
        university_id: university.id,
        achievement_text: a.text,
        achievement_date: a.date,
        display_order: index
      }))
      await (supabase as any).from('university_achievements').insert(achievementsData)
    }

    // Insert student organizations if provided
    if (student_orgs && student_orgs.length > 0) {
      const orgsData = (student_orgs || []).map((org: StudentOrgInput) => ({
        university_id: university.id,
        org_name: org.name,
        members_count: org.members,
        description: org.description
      }))
      await (supabase as any).from('student_organizations').insert(orgsData)
    }

    // Recalculate university rankings
    await (supabase as any).rpc('calculate_university_ranks')

    return NextResponse.json({
      message: 'University created successfully',
      university
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
 * PATCH /api/showcase/university-network
 * Update a university (Admin only)
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
        { error: 'Missing university ID' },
        { status: 400 }
      )
    }

    // Update university
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (universityError) {
      logger.error('Error updating university:', universityError)
      return NextResponse.json(
        { error: 'Failed to update university' },
        { status: 500 }
      )
    }

    // Recalculate rankings if rank-related fields changed
    if (updateData.events_hosted || updateData.students_active || updateData.total_attendance || updateData.rating) {
      await (supabase as any).rpc('calculate_university_ranks')
    }

    return NextResponse.json({
      message: 'University updated successfully',
      university
    })

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
