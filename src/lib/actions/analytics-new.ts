'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = createClient();

  // Get events count
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // Get tickets sold
  const { count: ticketsSold } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get total revenue
  const { data: orders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'completed');

  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

  // Get attendees count
  const { count: attendeesCount } = await supabase
    .from('tickets')
    .select('user_id', { count: 'exact', head: true })
    .eq('checked_in', true);

  return {
    success: true,
    stats: {
      events: eventsCount || 0,
      tickets: ticketsSold || 0,
      revenue: totalRevenue,
      attendees: attendeesCount || 0,
    },
  };
}

export async function getEventAnalytics(eventId: string) {
  const supabase = createClient();

  // Verify event exists
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  // Get ticket stats
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status, tier_id, created_at')
    .eq('event_id', eventId);

  // Get revenue
  const { data: orders } = await supabase
    .from('orders')
    .select('total, created_at, status')
    .eq('event_id', eventId)
    .eq('status', 'completed');

  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

  // Get check-ins
  const checkedInCount = tickets?.filter((t: any) => t.checked_in).length || 0;

  return {
    success: true,
    analytics: {
      totalTickets: tickets?.length || 0,
      soldTickets: tickets?.filter((t: any) => t.status === 'active').length || 0,
      checkedIn: checkedInCount,
      revenue: totalRevenue,
      orders: orders?.length || 0,
    },
  };
}

export async function getRevenueReport(startDate: string, endDate: string) {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('total, created_at, event:events(title)')
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

  return {
    success: true,
    report: {
      total: totalRevenue,
      orders: orders?.length || 0,
      details: orders || [],
    },
  };
}

export async function trackEventView(eventId: string) {
  const supabase = createClient();

  await supabase
    .from('event_views')
    .insert({
      event_id: eventId,
      viewed_at: new Date().toISOString(),
    });

  return { success: true };
}

export async function trackTicketScan(ticketId: string) {
  const supabase = createClient();

  await supabase
    .from('ticket_scans')
    .insert({
      ticket_id: ticketId,
      scanned_at: new Date().toISOString(),
    });

  return { success: true };
}
