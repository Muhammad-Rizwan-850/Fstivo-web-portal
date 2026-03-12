import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/showcase/sponsors
 * List all sponsors (admin only)
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

    const typedProfile = profile as any;
    if (!profile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('sponsors_full')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true });

    if (tier && tier !== 'all') {
      query = query.eq('tier_id', tier);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sponsors: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Error fetching sponsors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/showcase/sponsors
 * Create new sponsor (admin only)
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

    const typedProfile = profile as any;
    if (!profile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!name || !tier_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, tier_id' },
        { status: 400 }
      );
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
      } as any)
      .select()
      .single();

    if (sponsorError) {
      logger.error('Error creating sponsor:', sponsorError);
      return NextResponse.json({ error: sponsorError.message }, { status: 500 });
    }

    const typedSponsor = sponsor as any;

    // Insert impact metrics
    if (impact_metrics && impact_metrics.length > 0) {
      const typedSponsor = sponsor as any;
      const metricsData = impact_metrics.map((m: any, index: number) => ({
        sponsor_id: typedSponsor.id,
        metric_name: m.metric_name,
        metric_value: m.metric_value,
        metric_label: m.metric_label,
        display_order: index
      }));
      await (supabase as any).from('sponsor_impact_metrics').insert(metricsData);
    }

    // Insert testimonials
    if (testimonials && testimonials.length > 0) {
      const testimonialsData = testimonials.map((t: any) => ({
        sponsor_id: typedSponsor.id,
        testimonial_text: t.testimonial_text,
        author_name: t.author_name,
        author_position: t.author_position,
        is_featured: t.is_featured || false
      }));
      await (supabase as any).from('sponsor_testimonials').insert(testimonialsData);
    }

    // Insert success stories
    if (success_stories && success_stories.length > 0) {
      const storiesData = success_stories.map((s: any, index: number) => ({
        sponsor_id: typedSponsor.id,
        title: s.title,
        achievement: s.achievement,
        details: s.details,
        story_date: s.story_date,
        is_featured: s.is_featured || false,
        display_order: index
      }));
      await (supabase as any).from('sponsor_success_stories').insert(storiesData);
    }

    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (error) {
    logger.error('Error creating sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/showcase/sponsors
 * Update sponsor (admin only)
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

    const typedProfile = profile as any;
    if (!profile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, impact_metrics, testimonials, success_stories, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing sponsor ID' }, { status: 400 });
    }

    // Update sponsor
    const { data: sponsor, error } = await (supabase as any)
      .from('sponsors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update related data similarly to POST...

    return NextResponse.json({ sponsor });
  } catch (error) {
    logger.error('Error updating sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/showcase/sponsors
 * Delete sponsor (admin only)
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

    const typedProfile = profile as any;
    if (!profile || !['admin', 'super_admin'].includes(typedProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing sponsor ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
