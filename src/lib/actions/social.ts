'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const connectionRequestSchema = z.object({
  connected_user_id: z.string().uuid(),
});

const messageSchema = z.object({
  recipient_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function sendConnectionRequest(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = connectionRequestSchema.parse(data);

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(`and(user_id.eq.${user.id},connected_user_id.eq.${validated.connected_user_id}),and(user_id.eq.${validated.connected_user_id},connected_user_id.eq.${user.id})`)
    .single();

  if (existing) {
    return { error: 'Connection already exists or pending' };
  }

  const { error } = await (supabase
    .from('connections') as any)
    .insert({
      user_id: user.id,
      connected_user_id: validated.connected_user_id,
      status: 'pending',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/network');
  return { success: true };
}

export async function acceptConnectionRequest(connectionId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await (supabase
    .from('connections') as any)
    .update({ status: 'accepted' })
    .eq('id', connectionId)
    .eq('connected_user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/network');
  return { success: true };
}

export async function sendMessage(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = messageSchema.parse(data);

  const { error } = await (supabase
    .from('messages') as any)
    .insert({
      sender_id: user.id,
      recipient_id: validated.recipient_id,
      content: validated.content,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/network/messages');
  return { success: true };
}
