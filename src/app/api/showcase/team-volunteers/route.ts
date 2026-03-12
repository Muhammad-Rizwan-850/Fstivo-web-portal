import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';
import type {
  TeamMemberInput,
  VolunteerInput,
  SkillInput,
  SocialLinkInput,
  ShowcaseTeamVolunteerResult,
} from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/showcase/team-volunteers
 * Fetch team members and volunteers with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const section = searchParams.get('section') || 'all' // 'team', 'volunteers', or 'all'
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const level = searchParams.get('level')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result: ShowcaseTeamVolunteerResult = {
      stats: {}
    }

    // Fetch team members if requested
    if (section === 'all' || section === 'team') {
      let teamQuery = supabase
        .from('team_members_full')
        .select('*')

      // Apply filters
      if (role) {
        teamQuery = teamQuery.ilike('role', `%${role}%`)
      }

      if (department) {
        teamQuery = teamQuery.eq('department', department)
      }

      if (featured === 'true') {
        teamQuery = teamQuery.eq('is_featured', true)
      }

      // Order and pagination
      teamQuery = teamQuery
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: teamMembers, error: teamError } = await teamQuery

      if (teamError) {
        logger.error('Error fetching team members:', teamError)
        return NextResponse.json(
          { error: 'Failed to fetch team members' },
          { status: 500 }
        )
      }

      result.team = (teamMembers || []) as unknown[]
    }

    // Fetch volunteers if requested
    if (section === 'all' || section === 'volunteers') {
      let volunteerQuery = supabase
        .from('volunteers_full')
        .select('*')

      // Apply filters
      if (level && level !== 'all') {
        volunteerQuery = volunteerQuery.eq('level_id', level)
      }

      if (featured === 'true') {
        volunteerQuery = volunteerQuery.eq('is_featured', true)
      }

      // Order by points/rank and pagination
      volunteerQuery = volunteerQuery
        .order('total_points', { ascending: false })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data: volunteers, error: volunteerError } = await volunteerQuery

      if (volunteerError) {
        logger.error('Error fetching volunteers:', volunteerError)
        return NextResponse.json(
          { error: 'Failed to fetch volunteers' },
          { status: 500 }
        )
      }

      result.volunteers = (volunteers || []) as unknown[]

      // Get volunteer levels
      const { data: levels } = await supabase
        .from('volunteer_levels')
        .select('*')
        .order('display_order')

      result.levels = (levels || []) as unknown[]
    }

    // Fetch appreciation messages
    if (section === 'all' || section === 'appreciation') {
      const { data: messages } = await supabase
        .from('appreciation_messages')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(featured === 'true' ? 10 : 50)

      result.appreciation = (messages || []) as unknown[]
    }

    // Get badges
    if (section === 'all' || section === 'volunteers') {
      const { data: badges } = await supabase
        .from('volunteer_badges')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      result.badges = (badges || []) as unknown[]
    }

    // Get statistics
    const { data: stats } = await (supabase as any).rpc('get_team_volunteer_stats')

    result.stats = (stats as Record<string, unknown>) || {}

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/showcase/team-volunteers
 * Create team member or volunteer (Admin only)
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
    const { type, data } = body as { type: string; data: TeamMemberInput | VolunteerInput }

    if (type === 'team_member') {
      const tm = data as TeamMemberInput
      // Create team member
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          name: tm.name,
          role: tm.role,
          department: tm.department,
          bio: tm.bio,
          profile_image_url: tm.profile_image_url,
          email: tm.email,
          phone: tm.phone,
          location: tm.location,
          joined_date: tm.joined_date,
          is_active: true,
          is_featured: tm.is_featured || false,
          display_order: tm.display_order || 0
        })
        .select()
        .single()

      if (memberError) {
        logger.error('Error creating team member:', memberError)
        return NextResponse.json(
          { error: 'Failed to create team member' },
          { status: 500 }
        )
      }

      // Create stats entry
      await (supabase as any).from('team_member_stats').insert({
        team_member_id: teamMember.id,
        events_organized: (tm.stats && (tm.stats.events_organized as number)) || 0,
        volunteers_managed: (tm.stats && (tm.stats.volunteers_managed as number)) || 0,
        hours_contributed: (tm.stats && (tm.stats.hours_contributed as number)) || 0,
        projects_led: (tm.stats && (tm.stats.projects_led as number)) || 0,
        mentoring_score: (tm.stats && (tm.stats.mentoring_score as number)) || 0
      })

      // Add skills if provided
      if (data.skills && data.skills.length > 0) {
          const skillsData = (tm.skills || []).map((skill: SkillInput) => ({
            team_member_id: teamMember.id,
            skill_name: skill.name,
            skill_level: skill.level,
            years_experience: skill.years || 0
          }))
        await (supabase as any).from('team_member_skills').insert(skillsData)
      }

      // Add social links if provided
      if (tm.social_links && tm.social_links.length > 0) {
        const socialData = (tm.social_links || []).map((social: SocialLinkInput) => ({
          team_member_id: teamMember.id,
          platform: social.platform,
          url: social.url,
          username: social.username
        }))
        await (supabase as any).from('team_member_social').insert(socialData)
      }

      return NextResponse.json({
        message: 'Team member created successfully',
        team_member: teamMember
      }, { status: 201 })

    } else if (type === 'volunteer') {
      const vol = data as VolunteerInput
      // Create volunteer
      const { data: volunteer, error: volunteerError } = await supabase
        .from('volunteers')
        .insert({
          user_id: vol.user_id,
          name: vol.name,
          email: vol.email,
          phone: vol.phone,
          location: vol.location,
          profile_image_url: vol.profile_image_url,
          bio: vol.bio,
          skills: vol.skills || [],
          interests: vol.interests || [],
          total_points: vol.total_points || 0,
          is_active: true,
          is_featured: vol.is_featured || false
        })
        .select()
        .single()

      if (volunteerError) {
        logger.error('Error creating volunteer:', volunteerError)
        return NextResponse.json(
          { error: 'Failed to create volunteer' },
          { status: 500 }
        )
      }

      // Award badges if provided
      if ((vol as any).badges && (vol as any).badges.length > 0) {
        const badgesData = ((vol as any).badges || []).map((badgeId: string) => ({
          volunteer_id: volunteer.id,
          badge_id: badgeId
        }))
        await (supabase as any).from('volunteer_badges_earned').insert(badgesData)
      }

      return NextResponse.json({
        message: 'Volunteer created successfully',
        volunteer
      }, { status: 201 })

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "team_member" or "volunteer"' },
        { status: 400 }
      )
    }

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/showcase/team-volunteers
 * Update team member or volunteer (Admin only)
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
    const { type, id, data } = body

    if (type === 'team_member') {
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .update({
          name: data.name,
          role: data.role,
          department: data.department,
          bio: data.bio,
          profile_image_url: data.profile_image_url,
          email: data.email,
          phone: data.phone,
          location: data.location,
          is_featured: data.is_featured,
          display_order: data.display_order
        })
        .eq('id', id)
        .select()
        .single()

      if (memberError) {
        logger.error('Error updating team member:', memberError)
        return NextResponse.json(
          { error: 'Failed to update team member' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Team member updated successfully',
        team_member: teamMember
      })

    } else if (type === 'volunteer') {
      const { data: volunteer, error: volunteerError } = await supabase
        .from('volunteers')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          location: data.location,
          profile_image_url: data.profile_image_url,
          bio: data.bio,
          skills: data.skills,
          interests: data.interests,
          is_featured: data.is_featured
        })
        .eq('id', id)
        .select()
        .single()

      if (volunteerError) {
        logger.error('Error updating volunteer:', volunteerError)
        return NextResponse.json(
          { error: 'Failed to update volunteer' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Volunteer updated successfully',
        volunteer
      })

    } else if (type === 'appreciation') {
      const { data: message, error: messageError } = await supabase
        .from('appreciation_messages')
        .update({
          status: data.status,
          is_featured: data.is_featured
        })
        .eq('id', id)
        .select()
        .single()

      if (messageError) {
        logger.error('Error updating appreciation message:', messageError)
        return NextResponse.json(
          { error: 'Failed to update message' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Appreciation message updated successfully',
        appreciationMessage: message
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
