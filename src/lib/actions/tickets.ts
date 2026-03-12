'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ticketPurchaseSchema = z.object({
  tier_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
});

const ticketTransferSchema = z.object({
  recipient_email: z.string().email(),
  recipient_name: z.string().min(1),
});

export async function purchaseTickets(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = ticketPurchaseSchema.parse(data);

  // Check availability
  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('*, event:events(*)')
    .eq('id', validated.tier_id)
    .single();

  if (!tier) {
    return { error: 'Tier not found' };
  }

  if (tier.available < validated.quantity) {
    return { error: 'Not enough tickets available' };
  }

  // Create order
  const subtotal = tier.price * validated.quantity;
  const fees = Math.round(subtotal * 0.05);
  const total = subtotal + fees;

  const { data: order, error: orderError } = await (supabase
    .from('orders') as any)
    .insert({
      user_id: user.id,
      event_id: tier.event_id,
      subtotal,
      fees,
      total,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    return { error: orderError.message };
  }

  // Create tickets
  const tickets = Array.from({ length: validated.quantity }, (_, i) => ({
    user_id: user.id,
    event_id: tier.event_id,
    tier_id: validated.tier_id,
    order_id: order.id,
    status: 'reserved',
    qr_code: order.id + '-' + String(i + 1) + '-' + Math.random().toString(36).slice(2, 11),
  }));

  const { error: ticketsError } = await (supabase
    .from('tickets') as any)
    .insert(tickets);

  if (ticketsError) {
    return { error: ticketsError.message };
  }

  revalidatePath('/dashboard/tickets');
  return { success: true, order };
}

export async function transferTicket(ticketId: string, data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = ticketTransferSchema.parse(data);

  // Check ownership
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) {
    return { error: 'Ticket not found' };
  }

  if (ticket.status !== 'active') {
    return { error: 'Can only transfer active tickets' };
  }

  // Create transfer
  const { error } = await (supabase
    .from('ticket_transfers') as any)
    .insert({
      ticket_id: ticketId,
      from_user_id: user.id,
      recipient_email: validated.recipient_email,
      recipient_name: validated.recipient_name,
      status: 'pending',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/tickets');
  return { success: true };
}

export async function cancelTicket(ticketId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await (supabase
    .from('tickets') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/tickets');
  return { success: true };
}
