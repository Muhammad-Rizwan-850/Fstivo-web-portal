'use server';

import { revalidatePath } from 'next/cache';
import { createAuthenticatedClient } from '@/lib/supabase/server';

export async function getAllUsers(page: number = 1, limit: number = 50) {
  const supabase = await createAuthenticatedClient();
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
  const supabase = await createAuthenticatedClient();
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
  const supabase = await createAuthenticatedClient();
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
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      email: `deleted_${userId}@fstivo.com`,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function approveEvent(eventId: string) {
  const supabase = await createAuthenticatedClient();
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
  const supabase = await createAuthenticatedClient();
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
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

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
