'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function cloneEvent(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get original event
  const { data: original } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!original) {
    return { error: 'Event not found' };
  }

  // Clone event
  const { id, created_at, updated_at, ...eventData } = original;
  const { data: clone, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      title: `${original.title} (Copy)`,
      status: 'draft',
      organizer_id: user.id,
      slug: `${original.slug}-copy-${Date.now()}`,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event: clone };
}

export async function createTemplate(eventId: string, name: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  const { id, organizer_id, created_at, updated_at, slug, ...templateData } = event;
  const { error } = await supabase
    .from('event_templates')
    .insert({
      ...templateData,
      name,
      organizer_id: user.id,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/templates');
  return { success: true };
}

export async function createFromTemplate(templateId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: template } = await supabase
    .from('event_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    return { error: 'Template not found' };
  }

  const { id: templateDbId, organizer_id: templateOwnerId, created_at, updated_at, ...templateData } = template;
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...templateData,
      title: `${template.name}`,
      status: 'draft',
      organizer_id: user.id,
      slug: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}
