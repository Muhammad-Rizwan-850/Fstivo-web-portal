import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/showcase/team
 * List all team members (admin only)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('team_members_full')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,role.ilike.%${search}%,department.ilike.%${search}%`);
    }

    if (department) {
      query = query.eq('department', department);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      team: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/showcase/team
 * Create new team member (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      role,
      department,
      bio,
      profile_image_url,
      cover_image_url,
      email,
      phone,
      location,
      joined_date,
      is_featured,
      display_order,
      stats,
      skills,
      social_links,
      achievements
    } = body;

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, role' },
        { status: 400 }
      );
    }

    // Insert team member
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert({
        name,
        role,
        department,
        bio,
        profile_image_url,
        cover_image_url,
        email,
        phone,
        location,
        joined_date,
        is_featured,
        display_order,
        is_active: true
      } as any)
      .select()
      .single();

    if (memberError) {
      logger.error('Error creating team member:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Insert stats
    if (stats) {
      await (supabase as any).from('team_member_stats').insert({
        team_member_id: (member as any).id,
        events_organized: stats.events_organized || 0,
        volunteers_managed: stats.volunteers_managed || 0,
        hours_contributed: stats.hours_contributed || 0,
        projects_led: stats.projects_led || 0,
        mentoring_score: stats.mentoring_score || 0
      } as any);
    }

    // Insert skills
    if (skills && skills.length > 0) {
      const skillsData = skills.map((skill: any) => ({
        team_member_id: (member as any).id,
        skill_name: skill.skill_name,
        skill_level: skill.skill_level,
        years_experience: skill.years_experience
      }));
      await (supabase as any).from('team_member_skills').insert(skillsData);
    }

    // Insert social links
    if (social_links && social_links.length > 0) {
      const socialData = social_links.map((social: any) => ({
        team_member_id: (member as any).id,
        platform: social.platform,
        url: social.url,
        username: social.username
      }));
      await (supabase as any).from('team_member_social').insert(socialData);
    }

    // Insert achievements
    if (achievements && achievements.length > 0) {
      const achievementsData = achievements.map((a: any, index: number) => ({
        team_member_id: (member as any).id,
        achievement_title: a.title,
        achievement_description: a.description,
        achievement_date: a.date,
        is_featured: a.is_featured || false,
        display_order: index
      }));
      await (supabase as any).from('team_member_achievements').insert(achievementsData);
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    logger.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/showcase/team
 * Update team member (admin only)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing team member ID' }, { status: 400 });
    }

    const { data: member, error } = await (supabase as any)
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    logger.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/showcase/team
 * Delete team member (admin only)
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing team member ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    logger.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
