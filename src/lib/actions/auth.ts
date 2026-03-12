'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['attendee', 'organizer', 'admin']).default('attendee'),
});

const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500).optional(),
  headline: z.string().max(200).optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_handle: z.string().optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

// =====================================================
// AUTH ACTIONS
// =====================================================

export async function login(data: unknown) {
  const validated = loginSchema.parse(data);
  const supabase = createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function register(data: unknown) {
  const validated = registerSchema.parse(data);
  const supabase = createClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        full_name: validated.full_name,
        role: validated.role,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user' };
  }

  // Create user profile
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email: validated.email,
    full_name: validated.full_name,
    role: validated.role,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { 
    success: true, 
    message: 'Registration successful! Please check your email to verify your account.' 
  };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateProfile(data: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = updateProfileSchema.parse(data);

  const { error } = await supabase
    .from('users')
    .update(validated)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/profile');
  return { success: true };
}

export async function changePassword(data: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = changePasswordSchema.parse(data);

  // Verify current password first
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: validated.current_password,
  });

  if (verifyError) {
    return { error: 'Current password is incorrect' };
  }

  const { error } = await supabase.auth.updateUser({
    password: validated.new_password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password updated successfully' };
}

export async function requestPasswordReset(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/reset-password',
  });

  if (error) {
    return { error: error.message };
  }

  return { 
    success: true, 
    message: 'Password reset email sent! Please check your inbox.' 
  };
}

export async function resetPassword(newPassword: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Password reset successfully' };
}

export async function resendVerificationEmail() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email!,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Verification email sent' };
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/profile');
  return { success: true };
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Soft delete - mark as deleted
  const { error } = await supabase
    .from('users')
    .update({ 
      deleted_at: new Date().toISOString(),
      email: 'deleted_' + user.id + '@fstivo.com' 
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function getUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  return { success: true, profile };
}
