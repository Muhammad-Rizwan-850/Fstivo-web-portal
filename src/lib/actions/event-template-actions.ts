// =====================================================
// EVENT CLONING & TEMPLATES - SERVER ACTIONS
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export async function cloneEvent(eventId: string, newDate?: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: originalEvent, error: fetchError } = await (supabase
      .from('events')
      .select('*, ticket_types(*), speakers(*), sponsors(*)')
      .eq('id', eventId)
      .single() as any);

    if (fetchError || !originalEvent) {
      return { error: 'Event not found' };
    }

    if (originalEvent.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const timestamp = String(Date.now());
    const { data: newEvent, error: createError } = await (supabase
      .from('events') as any)
      .insert({
        ...originalEvent,
        id: undefined,
        title: originalEvent.title + ' (Copy)',
        start_date: newDate || originalEvent.start_date,
        slug: originalEvent.slug + '-copy-' + timestamp,
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single();

    if (createError) return { error: createError.message };

    if (originalEvent.ticket_types && originalEvent.ticket_types.length > 0) {
      await (supabase.from('ticket_types') as any).insert(
        originalEvent.ticket_types.map((tt: any) => ({
          ...tt,
          id: undefined,
          event_id: newEvent.id,
          created_at: undefined
        }))
      );
    }

    if (originalEvent.speakers && originalEvent.speakers.length > 0) {
      await (supabase.from('speakers') as any).insert(
        originalEvent.speakers.map((s: any) => ({
          ...s,
          id: undefined,
          event_id: newEvent.id,
          created_at: undefined
        }))
      );
    }

    revalidatePath('/dashboard/events');
    return { event: newEvent };
  } catch (error) {
    logger.error('Failed to clone event', error as Error);
    return { error: 'Failed to clone event' };
  }
}

export async function saveAsTemplate(eventId: string, templateData: {
  name: string;
  description?: string;
  category?: string;
  is_public?: boolean;
  price?: number;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: event, error: fetchError } = await (supabase
      .from('events')
      .select('*, ticket_types(*), speakers(*), sponsors(*)')
      .eq('id', eventId)
      .single() as any);

    if (fetchError || !event) {
      return { error: 'Event not found' };
    }

    if (event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data: template, error } = await (supabase
      .from('event_templates') as any)
      .insert({
        created_by: user.id,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        is_public: templateData.is_public || false,
        price: templateData.price || 0,
        template_data: {
          event,
          ticket_types: event.ticket_types,
          speakers: event.speakers,
          sponsors: event.sponsors
        }
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/templates');
    return { template };
  } catch (error) {
    logger.error('Failed to save as template', error as Error);
    return { error: 'Failed to save template' };
  }
}

export async function getEventTemplates(filters?: {
  category?: string;
  is_public?: boolean;
}) {
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('event_templates')
      .select('*, profiles:created_by(id, first_name, last_name, avatar_url)');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data: templates, error } = await query;

    if (error) return { error: error.message };
    return { templates };
  } catch (error) {
    logger.error('Failed to get event templates', error as Error);
    return { error: 'Failed to fetch templates' };
  }
}

export async function createFromTemplate(templateId: string, eventData: any) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: template, error: fetchError } = await supabase
      .from('event_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return { error: 'Template not found' };
    }

    const templateData = template.template_data as any;
    
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert({
        ...templateData.event,
        id: undefined,
        organizer_id: user.id,
        title: eventData.title,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        slug: eventData.slug,
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single();

    if (createError) return { error: createError.message };

    if (templateData.ticket_types && templateData.ticket_types.length > 0) {
      await supabase.from('ticket_types').insert(
        templateData.ticket_types.map((tt: any) => ({
          ...tt,
          id: undefined,
          event_id: newEvent.id,
          created_at: undefined
        }))
      );
    }

    await supabase
      .from('event_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    revalidatePath('/dashboard/events');
    return { event: newEvent };
  } catch (error) {
    logger.error('Failed to create from template', error as Error);
    return { error: 'Failed to create event from template' };
  }
}

export async function reviewTemplate(templateId: string, rating: number, review?: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: templateReview, error } = await supabase
      .from('template_reviews')
      .upsert({
        template_id: templateId,
        user_id: user.id,
        rating,
        review
      })
      .select()
      .single();

    if (error) return { error: error.message };

    const { data: reviews } = await supabase
      .from('template_reviews')
      .select('rating')
      .eq('template_id', templateId);

    if (reviews) {
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      await supabase
        .from('event_templates')
        .update({ rating: avgRating })
        .eq('id', templateId);
    }

    revalidatePath('/templates/' + templateId);
    return { review: templateReview };
  } catch (error) {
    logger.error('Failed to review template', error as Error);
    return { error: 'Failed to submit review' };
  }
}

export async function createEventSeries(data: {
  name: string;
  description?: string;
  recurrence_pattern: string;
  recurrence_config: any;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  template_event_id: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: series, error } = await supabase
      .from('event_series')
      .insert({
        ...data,
        created_by: user.id
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/series');
    return { series };
  } catch (error) {
    logger.error('Failed to create event series', error as Error);
    return { error: 'Failed to create series' };
  }
}
