// =====================================================
// SEATING & VENUE MANAGEMENT - SERVER ACTIONS
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// VENUE MANAGEMENT
// ============================================================================

export async function createVenue(data: {
  name: string;
  address: string;
  city: string;
  country?: string;
  total_capacity: number;
  description?: string;
  amenities?: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        ...data,
        created_by: user.id
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/venues');
    return { venue };
  } catch (error) {
    logger.error('Failed to create venue', error as Error);
    return { error: 'Failed to create venue' };
  }
}

export async function getVenues(filters?: {
  city?: string;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('venues')
      .select('*, profiles:created_by(id, first_name, last_name)');

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data: venues, error } = await query;

    if (error) return { error: error.message };
    return { venues };
  } catch (error) {
    logger.error('Failed to get venues', error as Error);
    return { error: 'Failed to fetch venues' };
  }
}

// ============================================================================
// SEATING LAYOUTS
// ============================================================================

export async function createSeatingLayout(data: {
  venue_id: string;
  event_id?: string;
  name: string;
  description?: string;
  layout_type: string;
  total_seats: number;
  layout_data: any;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: layout, error } = await supabase
      .from('seating_layouts')
      .insert(data)
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/venues/' + data.venue_id);
    return { layout };
  } catch (error) {
    logger.error('Failed to create seating layout', error as Error);
    return { error: 'Failed to create layout' };
  }
}

export async function getSeatingLayouts(venueId?: string, eventId?: string) {
  try {
    const supabase = await createServerClient();
    let query = supabase.from('seating_layouts').select('*');

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: layouts, error } = await query;

    if (error) return { error: error.message };
    return { layouts };
  } catch (error) {
    logger.error('Failed to get seating layouts', error as Error);
    return { error: 'Failed to fetch layouts' };
  }
}

// ============================================================================
// SEATING SECTIONS
// ============================================================================

export async function createSeatingSection(data: {
  layout_id: string;
  name: string;
  description?: string;
  section_type: string;
  color?: string;
  capacity: number;
  price: number;
  position: any;
}) {
  try {
    const supabase = await createServerClient();

    const { data: section, error } = await supabase
      .from('seating_sections')
      .insert({
        ...data,
        available_seats: data.capacity
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { section };
  } catch (error) {
    logger.error('Failed to create seating section', error as Error);
    return { error: 'Failed to create section' };
  }
}

// ============================================================================
// SEAT MANAGEMENT
// ============================================================================

export async function generateSeats(sectionId: string, seatConfig: {
  rows: number;
  seatsPerRow: number;
  startRow: string;
  startNumber: number;
}) {
  try {
    const supabase = await createServerClient();
    const seats = [];
    let rowLabel = seatConfig.startRow;
    
    for (let row = 0; row < seatConfig.rows; row++) {
      for (let col = 0; col < seatConfig.seatsPerRow; col++) {
        seats.push({
          section_id: sectionId,
          seat_number: rowLabel + String(seatConfig.startNumber + col),
          row_label: rowLabel,
          column_number: col + 1,
          position: { x: col * 40, y: row * 40 }
        });
      }
      rowLabel = String.fromCharCode(rowLabel.charCodeAt(0) + 1);
    }

    const { error } = await supabase.from('seats').insert(seats);

    if (error) return { error: error.message };
    return { count: seats.length };
  } catch (error) {
    logger.error('Failed to generate seats', error as Error);
    return { error: 'Failed to generate seats' };
  }
}

export async function getSeats(sectionId: string, filters?: {
  status?: string;
}) {
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('seats')
      .select('*')
      .eq('section_id', sectionId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: seats, error } = await query;

    if (error) return { error: error.message };
    return { seats };
  } catch (error) {
    logger.error('Failed to get seats', error as Error);
    return { error: 'Failed to fetch seats' };
  }
}

export async function getSeatingAvailability(layoutId: string) {
  try {
    const supabase = await createServerClient();

    const { data: availability, error } = await supabase
      .from('v_seating_availability')
      .select('*')
      .eq('layout_id', layoutId)
      .single();

    if (error) return { error: error.message };
    return { availability };
  } catch (error) {
    logger.error('Failed to get seating availability', error as Error);
    return { error: 'Failed to fetch availability' };
  }
}

// ============================================================================
// SEAT RESERVATIONS
// ============================================================================

export async function reserveSeat(seatId: string, registrationId: string, holdDuration: number = 10) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: seat } = await supabase
      .from('seats')
      .select('status')
      .eq('id', seatId)
      .single();

    if (!seat || seat.status !== 'available') {
      return { error: 'Seat not available' };
    }

    const heldUntil = new Date(Date.now() + holdDuration * 60 * 1000).toISOString();

    const { data: reservation, error } = await supabase
      .from('seat_reservations')
      .insert({
        seat_id: seatId,
        registration_id: registrationId,
        user_id: user.id,
        status: 'held',
        held_until: heldUntil
      })
      .select()
      .single();

    if (error) return { error: error.message };

    await supabase
      .from('seats')
      .update({ status: 'held' })
      .eq('id', seatId);

    return { reservation };
  } catch (error) {
    logger.error('Failed to reserve seat', error as Error);
    return { error: 'Failed to reserve seat' };
  }
}

export async function confirmSeatReservation(reservationId: string) {
  try {
    const supabase = await createServerClient();

    const { data: reservation, error: fetchError } = await supabase
      .from('seat_reservations')
      .select('*, seat_id')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found' };
    }

    const { error: updateError } = await supabase
      .from('seat_reservations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (updateError) return { error: updateError.message };

    await supabase
      .from('seats')
      .update({ status: 'sold' })
      .eq('id', reservation.seat_id);

    return { success: true };
  } catch (error) {
    logger.error('Failed to confirm seat reservation', error as Error);
    return { error: 'Failed to confirm reservation' };
  }
}

export async function cancelSeatReservation(reservationId: string) {
  try {
    const supabase = await createServerClient();

    const { data: reservation, error: fetchError } = await supabase
      .from('seat_reservations')
      .select('*, seat_id')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return { error: 'Reservation not found' };
    }

    const { error: updateError } = await supabase
      .from('seat_reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (updateError) return { error: updateError.message };

    await supabase
      .from('seats')
      .update({ status: 'available' })
      .eq('id', reservation.seat_id);

    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel seat reservation', error as Error);
    return { error: 'Failed to cancel reservation' };
  }
}

// ============================================================================
// ACCESSIBILITY REQUESTS
// ============================================================================

export async function requestAccessibleSeating(
  eventId: string,
  requirementType: string,
  details: string
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: request, error } = await supabase
      .from('accessibility_requests')
      .insert({
        event_id: eventId,
        user_id: user.id,
        requirement_type: requirementType,
        details
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { request };
  } catch (error) {
    logger.error('Failed to request accessible seating', error as Error);
    return { error: 'Failed to submit request' };
  }
}

export async function getAccessibilityRequests(eventId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: event } = await (supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single() as any);

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data: requests, error } = await supabase
      .from('accessibility_requests')
      .select('*, profiles:user_id(id, first_name, last_name, email)')
      .eq('event_id', eventId);

    if (error) return { error: error.message };
    return { requests };
  } catch (error) {
    logger.error('Failed to get accessibility requests', error as Error);
    return { error: 'Failed to fetch requests' };
  }
}

// ============================================================================
// GROUP SEATING
// ============================================================================

export async function createGroupSeatingReservation(
  eventId: string,
  sectionId: string,
  groupName: string,
  requestedSeats: number
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: groupReservation, error } = await supabase
      .from('group_seat_reservations')
      .insert({
        event_id: eventId,
        section_id: sectionId,
        organizer_user_id: user.id,
        group_name: groupName,
        requested_seats: requestedSeats,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { groupReservation };
  } catch (error) {
    logger.error('Failed to create group seating reservation', error as Error);
    return { error: 'Failed to create group reservation' };
  }
}
