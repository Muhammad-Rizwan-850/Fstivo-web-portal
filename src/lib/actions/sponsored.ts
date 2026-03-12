'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const sponsoredEventSchema = z.object({
  event_id: z.string().uuid(),
  placement: z.enum(['homepage_hero', 'search_top', 'category_featured', 'sidebar']),
  start_date: z.string(),
  end_date: z.string(),
});

export async function createSponsoredEvent(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = sponsoredEventSchema.parse(data);

  const startDate = new Date(validated.start_date);
  const endDate = new Date(validated.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const placementCost: Record<string, number> = {
    homepage_hero: 5000,
    search_top: 3000,
    category_featured: 2000,
    sidebar: 1000,
  };

  const cost = (placementCost[validated.placement] || 1000) * days;

  const { error } = await supabase
    .from('sponsored_events')
    .insert({
      ...validated,
      sponsor_id: user.id,
      cost,
      status: 'pending',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/sponsored-events');
  return { success: true };
}

export async function approveSponsoredEvent(sponsoredId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('sponsored_events')
    .update({ status: 'active' })
    .eq('id', sponsoredId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/sponsored-events');
  return { success: true };
}

export async function rejectSponsoredEvent(sponsoredId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('sponsored_events')
    .update({
      status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', sponsoredId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/sponsored-events');
  return { success: true };
}
