import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/showcase/events
 * List all past events (admin only)
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = (supabase as any)
      .from('past_events_showcase')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/showcase/events
 * Create new past event (admin only)
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
      title,
      description,
      date,
      year,
      location,
      category,
      attendees_count,
      rating,
      featured_image,
      highlights,
      gallery_images,
      testimonials,
      impact_metrics,
      status = 'published'
    } = body;

    // Validate required fields
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      );
    }

    // Insert event
    const { data: event, error: eventError } = await (supabase as any)
      .from('past_events_showcase')
      .insert({
        title,
        description,
        date,
        year: year || new Date(date).getFullYear(),
        location,
        category,
        attendees_count,
        rating,
        featured_image,
        highlights,
        status
      } as any)
      .select()
      .single();

    if (eventError) {
      logger.error('Error creating event:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Insert gallery images
    if (gallery_images && gallery_images.length > 0) {
      const galleryData = gallery_images.map((img: any, index: number) => ({
        showcase_event_id: (event as any).id,
        image_url: img.url,
        caption: img.caption,
        display_order: index
      }));
      await (supabase as any).from('event_gallery').insert(galleryData);
    }

    // Insert testimonials
    if (testimonials && testimonials.length > 0) {
      const testimonialData = testimonials.map((t: any) => ({
        showcase_event_id: (event as any).id,
        attendee_name: t.name,
        attendee_role: t.role,
        testimonial_text: t.text,
        rating: t.rating
      }));
      await (supabase as any).from('event_testimonials').insert(testimonialData);
    }

    // Insert impact metrics
    if (impact_metrics && impact_metrics.length > 0) {
      const metricsData = impact_metrics.map((m: any) => ({
        showcase_event_id: (event as any).id,
        metric_name: m.name,
        metric_value: m.value
      }));
      await (supabase as any).from('event_impact_metrics').insert(metricsData);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    logger.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/showcase/events
 * Update event (admin only)
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
    const { id, gallery_images, testimonials, impact_metrics, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    // Update event
    const { data: event, error } = await (supabase as any)
      .from('past_events_showcase')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update gallery images if provided
    if (gallery_images) {
      // Delete existing images
      await (supabase as any).from('event_gallery').delete().eq('showcase_event_id', id);

      // Insert new images
      if (gallery_images.length > 0) {
        const galleryData = gallery_images.map((img: any, index: number) => ({
          showcase_event_id: id,
          image_url: img.url,
          caption: img.caption,
          display_order: index
        }));
        await (supabase as any).from('event_gallery').insert(galleryData);
      }
    }

    // Update testimonials if provided
    if (testimonials) {
      // Delete existing testimonials
      await (supabase as any).from('event_testimonials').delete().eq('showcase_event_id', id);

      // Insert new testimonials
      if (testimonials.length > 0) {
        const testimonialData = testimonials.map((t: any) => ({
          showcase_event_id: id,
          attendee_name: t.name,
          attendee_role: t.role,
          testimonial_text: t.text,
          rating: t.rating
        }));
        await (supabase as any).from('event_testimonials').insert(testimonialData);
      }
    }

    // Update impact metrics if provided
    if (impact_metrics) {
      // Delete existing metrics
      await (supabase as any).from('event_impact_metrics').delete().eq('showcase_event_id', id);

      // Insert new metrics
      if (impact_metrics.length > 0) {
        const metricsData = impact_metrics.map((m: any) => ({
          showcase_event_id: id,
          metric_name: m.name,
          metric_value: m.value
        }));
        await (supabase as any).from('event_impact_metrics').insert(metricsData);
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    logger.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/showcase/events
 * Delete event (admin only)
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
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('past_events_showcase')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
