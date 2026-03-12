'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAuthenticatedClient } from '@/lib/supabase/server';

export async function getNotifications(limit: number = 50) {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { success: true, notifications };
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/notifications');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/notifications');
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/notifications');
  return { success: true };
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      read: false,
    });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getUnreadCount() {
  const supabase = await createAuthenticatedClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    return { error: error.message };
  }

  return { success: true, count: count || 0 };
}
