'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const venueSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  capacity: z.number().min(1),
  description: z.string().optional(),
});

const seatingChartSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1),
  total_seats: z.number().min(1),
  sections: z.array(z.object({
    name: z.string().min(1),
    rows: z.number().min(1),
    seats_per_row: z.number().min(1),
    price_multiplier: z.number().min(1).default(1),
  })),
});

export async function createVenue(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = venueSchema.parse(data);

  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      ...validated,
      organizer_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/venues');
  return { success: true, venue };
}

export async function createSeatingChart(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = seatingChartSchema.parse(data);

  const { data: chart, error } = await supabase
    .from('seating_charts')
    .insert({
      event_id: validated.event_id,
      name: validated.name,
      total_seats: validated.total_seats,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create sections
  const sections = validated.sections.map((section) => ({
    chart_id: chart.id,
    name: section.name,
    rows: section.rows,
    seats_per_row: section.seats_per_row,
    price_multiplier: section.price_multiplier,
  }));

  const { error: sectionsError } = await supabase
    .from('seating_sections')
    .insert(sections);

  if (sectionsError) {
    return { error: sectionsError.message };
  }

  revalidatePath(`/events/${validated.event_id}`);
  return { success: true, chart };
}
