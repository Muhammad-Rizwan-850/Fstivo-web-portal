import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/showcase/universities
 * List all universities (admin only)
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('universities')
      .select('*', { count: 'exact' })
      .order('rank', { ascending: true, nullsFirst: false });

    if (city && city !== 'all') {
      query = query.eq('city', city);
    }

    if (tier && tier !== 'all') {
      query = query.eq('tier_id', tier);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,full_name.ilike.%${search}%,city.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      universities: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Error fetching universities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/showcase/universities
 * Create new university (admin only)
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      full_name,
      city,
      logo_url,
      tier_id,
      students_active = 0,
      events_hosted = 0,
      ambassadors_count = 0,
      total_attendance = 0,
      rating = 0.0,
      joined_date,
      is_active = true,
      is_featured = false,
      campuses = [],
      achievements = [],
      student_orgs = [],
      top_events = []
    } = body;

    // Validate required fields
    if (!name || !city || !joined_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, joined_date' },
        { status: 400 }
      );
    }

    // Insert university
    const { data: university, error: universityError } = await (supabase as any)
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
        is_active,
        is_featured
      })
      .select()
      .single();

    if (universityError) {
      logger.error('Error creating university:', universityError);
      return NextResponse.json({ error: universityError.message }, { status: 500 });
    }

    // Insert campuses
    if (campuses && campuses.length > 0 && university?.id) {
      const campusesData = campuses.map((campus_city: string) => ({
        university_id: university.id,
        campus_city
      }));
      await (supabase as any).from('university_campuses').insert(campusesData);
    }

    // Insert achievements
    if (achievements && achievements.length > 0 && university?.id) {
      const achievementsData = achievements.map((text: string, index: number) => ({
        university_id: university.id,
        achievement_text: text,
        display_order: index
      }));
      await (supabase as any).from('university_achievements').insert(achievementsData);
    }

    // Insert student organizations
    if (student_orgs && student_orgs.length > 0 && university?.id) {
      const orgsData = student_orgs.map((org: any) => ({
        university_id: university.id,
        org_name: org.name,
        members_count: org.members || 0,
        description: org.description || null
      }));
      await (supabase as any).from('student_organizations').insert(orgsData);
    }

    // Insert top events
    if (top_events && top_events.length > 0 && university?.id) {
      const eventsData = top_events.map((event: any) => ({
        university_id: university.id,
        event_name: event.name,
        event_date: event.date,
        attendees: event.attendees,
        is_top_event: true
      }));
      await (supabase as any).from('university_events').insert(eventsData);
    }

    // Recalculate rankings
    await (supabase as any).rpc('calculate_university_ranks');

    return NextResponse.json({ university }, { status: 201 });
  } catch (error) {
    logger.error('Error creating university:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/showcase/universities
 * Update university (admin only)
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, campuses, achievements, student_orgs, top_events, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing university ID' }, { status: 400 });
    }

    // Update university
    const { data: university, error } = await (supabase as any)
      .from('universities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update campuses if provided
    if (campuses) {
      await (supabase as any).from('university_campuses').delete().eq('university_id', id);

      if (campuses.length > 0) {
        const campusesData = campuses.map((campus_city: string) => ({
          university_id: id,
          campus_city
        }));
        await (supabase as any).from('university_campuses').insert(campusesData);
      }
    }

    // Update achievements if provided
    if (achievements) {
      await (supabase as any).from('university_achievements').delete().eq('university_id', id);

      if (achievements.length > 0) {
        const achievementsData = achievements.map((text: string, index: number) => ({
          university_id: id,
          achievement_text: text,
          display_order: index
        }));
        await (supabase as any).from('university_achievements').insert(achievementsData);
      }
    }

    // Update student orgs if provided
    if (student_orgs) {
      await (supabase as any).from('student_organizations').delete().eq('university_id', id);

      if (student_orgs.length > 0) {
        const orgsData = student_orgs.map((org: any) => ({
          university_id: id,
          org_name: org.name,
          members_count: org.members || 0,
          description: org.description || null
        }));
        await (supabase as any).from('student_organizations').insert(orgsData);
      }
    }

    // Update top events if provided
    if (top_events) {
      await (supabase as any).from('university_events').delete().eq('university_id', id);

      if (top_events.length > 0) {
        const eventsData = top_events.map((event: any) => ({
          university_id: id,
          event_name: event.name,
          event_date: event.date,
          attendees: event.attendees,
          is_top_event: true
        }));
        await (supabase as any).from('university_events').insert(eventsData);
      }
    }

    // Recalculate rankings
    await (supabase as any).rpc('calculate_university_ranks');

    return NextResponse.json({ university });
  } catch (error) {
    logger.error('Error updating university:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/showcase/universities
 * Delete university (admin only)
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing university ID' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('universities')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalculate rankings after deletion
    await (supabase as any).rpc('calculate_university_ranks');

    return NextResponse.json({ message: 'University deleted successfully' });
  } catch (error) {
    logger.error('Error deleting university:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
