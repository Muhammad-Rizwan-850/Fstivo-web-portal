'use server';

import { createClient } from '@/lib/supabase/server';

// =====================================================
// ANALYTICS ACTIONS
// =====================================================

export async function getDashboardStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get events count
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', user.id);

  // Get tickets sold
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status, id')
    .eq('status', 'active');

  const ticketsSold = tickets?.length || 0;

  // Get total revenue
  const { data: orders } = await supabase
    .from('orders')
    .select('total, status')
    .eq('status', 'completed');

  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

  // Get attendees count
  const { count: attendeesCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('checked_in', true);

  return {
    success: true,
    stats: {
      events: eventsCount || 0,
      tickets: ticketsSold,
      revenue: totalRevenue,
      attendees: attendeesCount || 0,
    },
  };
}

export async function getEventAnalytics(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('total, created_at, event:events(title)')
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .in('event_id',
      supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id)
    );

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

export async function getEventsAnalytics(eventIds: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug')
    .in('id', eventIds)
    .eq('organizer_id', user.id);

  return { success: true, events };
}

export async function getTicketSalesAnalytics(eventId: string, period: string = '7d') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  if (period === '7d') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === '30d') {
    startDate.setDate(endDate.getDate() - 30);
  } else if (period === '90d') {
    startDate.setDate(endDate.getDate() - 90);
  }

  const { data: sales } = await supabase
    .from('orders')
    .select('created_at, total, status')
    .eq('event_id', eventId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const groupedSales: Record<string, number> = {};
  
  sales?.forEach((sale: any) => {
    const date = new Date(sale.created_at).toISOString().split('T')[0];
    if (!groupedSales[date]) {
      groupedSales[date] = 0;
    }
    groupedSales[date] += sale.total || 0;
  });

  return {
    success: true,
    sales: groupedSales,
    total: sales?.reduce((sum: number, s: any) => sum + (s.total || 0), 0) || 0,
  };
}
