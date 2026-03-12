'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// ADMIN ACTIONS
// =====================================================

export async function getAllUsers(page: number = 1, limit: number = 50) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    return { error: 'Forbidden' };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: users, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    users,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function suspendUser(userId: string, reason: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      status: 'active',
      suspended_at: null,
      suspension_reason: null,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      email: 'deleted_' + userId + '@fstivo.com',
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function approveEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .update({ 
      status: 'published',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/events');
  return { success: true };
}

export async function rejectEvent(eventId: string, reason: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/events');
  return { success: true };
}

export async function getPlatformStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: ticketsCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });

  const { data: revenue } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'completed');

  const totalRevenue = revenue?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

  return {
    success: true,
    stats: {
      users: usersCount || 0,
      events: eventsCount || 0,
      tickets: ticketsCount || 0,
      revenue: totalRevenue,
    },
  };
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function getSystemHealth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Check database connectivity
  const { error } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  const dbHealthy = !error;

  return {
    success: true,
    health: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function getRecentActivity(limit: number = 20) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get recent events, orders, and registrations
  const [recentEvents, recentOrders] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('orders')
      .select('id, total, created_at, user:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    success: true,
    activity: {
      events: recentEvents.data || [],
      orders: recentOrders.data || [],
    },
  };
}

export async function exportData(type: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  let data = [];
  let filename = '';

  switch (type) {
    case 'users':
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      data = users || [];
      filename = 'users-export.json';
      break;
    case 'events':
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      data = events || [];
      filename = 'events-export.json';
      break;
    case 'orders':
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      data = orders || [];
      filename = 'orders-export.json';
      break;
    default:
      return { error: 'Invalid export type' };
  }

  return {
    success: true,
    data,
    filename,
  };
}
