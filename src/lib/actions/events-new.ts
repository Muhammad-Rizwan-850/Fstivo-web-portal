'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { eventSchema } from '@/lib/validators/event.schema';
import { generateSlug } from '@/lib/utils';

export async function createEvent(data: unknown) {
  const supabase = createClient();
  const validated = eventSchema.parse(data);

  // Generate slug
  const slug = generateSlug(validated.title);

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...validated,
      slug,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function updateEvent(eventId: string, data: unknown) {
  const supabase = createClient();
  const validated = eventSchema.parse(data);

  // Update slug if title changed
  const slug = generateSlug(validated.title);

  const { data: event, error } = await supabase
    .from('events')
    .update({
      ...validated,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${slug}`);
  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();

  // Soft delete
  const { error } = await supabase
    .from('events')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'cancelled'
    })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function publishEvent(eventId: string) {
  const supabase = createClient();

  const { data: event, error } = await supabase
    .from('events')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${event.slug}`);
  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function duplicateEvent(eventId: string) {
  const supabase = createClient();

  // Get original event
  const { data: original, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !original) {
    return { error: 'Event not found' };
  }

  // Create duplicate
  const { id, created_at, updated_at, slug, ...eventData } = original;
  const newSlug = `${generateSlug(original.title)}-copy`;

  const { data: duplicate, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event: duplicate };
}

export async function toggleFeatured(eventId: string) {
  const supabase = createClient();

  // Get current status
  const { data: event } = await supabase
    .from('events')
    .select('is_featured')
    .eq('id', eventId)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  const { error } = await supabase
    .from('events')
    .update({ is_featured: !event.is_featured })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function addEventToWishlist(eventId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('wishlists')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      event_id: eventId,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function removeEventFromWishlist(eventId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .eq('event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
