import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/showcase/partners
 * List all community partners (admin only)
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
    const type = searchParams.get('type');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('community_partners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type_id', type);
    }

    if (level && level !== 'all') {
      query = query.eq('partnership_level', level);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      partners: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Error fetching partners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/showcase/partners
 * Create new community partner (admin only)
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
      type_id,
      logo_url,
      description,
      location,
      since_year,
      partnership_level,
      website,
      email,
      phone,
      is_active = true,
      is_featured = false,
      collaborations = [],
      joint_events = [],
      impact_metrics = [],
      testimonial = null
    } = body;

    // Validate required fields
    if (!name || !type_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type_id' },
        { status: 400 }
      );
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
        is_active,
        is_featured
      } as any)
      .select()
      .single();

    if (partnerError) {
      logger.error('Error creating partner:', partnerError);
      return NextResponse.json({ error: partnerError.message }, { status: 500 });
    }

    const typedPartner = partner as any;

    // Insert collaborations
    if (collaborations && collaborations.length > 0 && typedPartner?.id) {
      const collabData = collaborations.map((text: string, index: number) => ({
        partner_id: typedPartner.id,
        collaboration_text: text,
        display_order: index
      }));
      await (supabase as any).from('partner_collaborations').insert(collabData);
    }

    // Insert joint events
    if (joint_events && joint_events.length > 0 && typedPartner?.id) {
      const eventsData = joint_events.map((event: any) => ({
        partner_id: typedPartner.id,
        event_name: event.name,
        event_date: event.date,
        attendees: event.attendees,
        description: event.description || null
      }));
      await (supabase as any).from('partner_joint_events').insert(eventsData);
    }

    // Insert impact metrics
    if (impact_metrics && impact_metrics.length > 0 && typedPartner?.id) {
      const metricsData = impact_metrics.map((m: any, index: number) => ({
        partner_id: typedPartner.id,
        metric_name: m.name,
        metric_value: m.value,
        display_order: index
      }));
      await (supabase as any).from('partner_impact_metrics').insert(metricsData);
    }

    // Insert testimonial
    if (testimonial && typedPartner?.id) {
      await (supabase as any).from('partner_testimonials').insert({
        partner_id: typedPartner.id,
        testimonial_text: testimonial.text,
        author_name: testimonial.author,
        author_position: testimonial.position || null,
        is_featured: false
      } as any);
    }

    return NextResponse.json({ partner: typedPartner }, { status: 201 });
  } catch (error) {
    logger.error('Error creating partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/showcase/partners
 * Update community partner (admin only)
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

    const typedProfile = profile as any;

    if (!typedProfile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, collaborations, joint_events, impact_metrics, testimonial, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 });
    }

    // Update partner
    const { data: partner, error } = await (supabase as any)
      .from('community_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update collaborations if provided
    if (collaborations) {
      await (supabase as any).from('partner_collaborations').delete().eq('partner_id', id);

      if (collaborations.length > 0) {
        const collabData = collaborations.map((text: string, index: number) => ({
          partner_id: id,
          collaboration_text: text,
          display_order: index
        }));
        await (supabase as any).from('partner_collaborations').insert(collabData);
      }
    }

    // Update joint events if provided
    if (joint_events) {
      await (supabase as any).from('partner_joint_events').delete().eq('partner_id', id);

      if (joint_events.length > 0) {
        const eventsData = joint_events.map((event: any) => ({
          partner_id: id,
          event_name: event.name,
          event_date: event.date,
          attendees: event.attendees,
          description: event.description
        }));
        await (supabase as any).from('partner_joint_events').insert(eventsData);
      }
    }

    // Update impact metrics if provided
    if (impact_metrics) {
      await (supabase as any).from('partner_impact_metrics').delete().eq('partner_id', id);

      if (impact_metrics.length > 0) {
        const metricsData = impact_metrics.map((m: any, index: number) => ({
          partner_id: id,
          metric_name: m.name,
          metric_value: m.value,
          display_order: index
        }));
        await (supabase as any).from('partner_impact_metrics').insert(metricsData);
      }
    }

    return NextResponse.json({ partner });
  } catch (error) {
    logger.error('Error updating partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/showcase/partners
 * Delete community partner (admin only)
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

    const typedProfile = profile as any;

    if (!typedProfile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('community_partners')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    logger.error('Error deleting partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
