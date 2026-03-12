'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function checkInTicket(eventId: string, qrCode: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', success: false };
  }

  // Validate ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, event:events(*), attendee:attendees(*), tier:ticket_tiers(*)')
    .eq('qr_code', qrCode)
    .eq('event_id', eventId)
    .single();

  if (ticketError || !ticket) {
    return { success: false, message: 'Invalid ticket' };
  }

  if (ticket.checked_in) {
    return {
      success: false,
      message: 'Ticket already checked in',
      checked_in_at: ticket.checked_in_at,
    };
  }

  if (ticket.status !== 'active') {
    return {
      success: false,
      message: `Ticket is ${ticket.status}. Cannot check in.`,
    };
  }

  // Check in
  const { error } = await supabase
    .from('tickets')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
    })
    .eq('id', ticket.id);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(`/events/${eventId}/checkin`);
  return {
    success: true,
    message: 'Check-in successful',
    ticket: {
      attendee: ticket.attendee,
      tier: ticket.tier,
    },
  };
}

export async function bulkCheckIn(eventId: string, ticketIds: string[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id')
    .in('id', ticketIds)
    .eq('event_id', eventId)
    .eq('checked_in', false);

  const validTicketIds = tickets?.map((t: any) => t.id) || [];

  if (validTicketIds.length === 0) {
    return { error: 'No valid tickets to check in', count: 0 };
  }

  const { error } = await supabase
    .from('tickets')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
    })
    .in('id', validTicketIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}/checkin`);
  return { success: true, count: validTicketIds.length };
}

export async function undoCheckIn(eventId: string, ticketId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('tickets')
    .update({
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
    })
    .eq('id', ticketId)
    .eq('event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}/checkin`);
  return { success: true };
}
