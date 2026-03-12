'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from './config'
import { z } from 'zod'
import { logger } from '@/lib/logger';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['organizer', 'volunteer', 'sponsor', 'attendee']),
})

const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  experience: z.number().min(0).max(50).optional(),
})

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = signInSchema.safeParse(data)

  if (!validatedFields.success) {
    redirect('/sign-in?error=Invalid credentials')
  }

  const { error } = await supabase.auth.signInWithPassword(validatedFields.data)

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    full_name: formData.get('full_name') as string,
    role: formData.get('role') as string,
  }

  const validatedFields = signUpSchema.safeParse(data)

  if (!validatedFields.success) {
    redirect('/sign-up?error=Invalid input')
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
      data: {
        full_name: validatedFields.data.full_name,
        role: validatedFields.data.role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`)
  }

  // Create profile in profiles table
  if (authData.user) {
    const { error: profileError } = await (supabase.from('profiles') as any).insert({
      id: authData.user.id,
      email: validatedFields.data.email,
      full_name: validatedFields.data.full_name,
      role: validatedFields.data.role,
    })

    if (profileError) {
      logger.error('Profile creation error:', profileError)
      // Continue anyway as profile might be created by trigger
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
  })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/reset-password?success=Password reset email sent')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/reset-password/confirm?error=Passwords do not match')
  }

  if (password.length < 6) {
    redirect('/reset-password/confirm?error=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    redirect(`/reset-password/confirm?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard?success=Password updated successfully')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?error=You must be logged in')
  }

  const data = {
    full_name: formData.get('full_name') as string,
    bio: formData.get('bio') as string,
    phone: formData.get('phone') as string,
    location: formData.get('location') as string,
    website: formData.get('website') as string,
    skills: formData.get('skills') as string,
    experience: formData.get('experience') as string,
  }

  const validatedFields = updateProfileSchema.safeParse({
    ...data,
    skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
    experience: data.experience ? parseInt(data.experience) : undefined,
  })

  if (!validatedFields.success) {
    return { error: 'Invalid input', details: validatedFields.error.flatten() }
  }

  const { error } = await (supabase.from('profiles') as any).update({
    full_name: validatedFields.data.full_name,
    bio: validatedFields.data.bio,
    phone: validatedFields.data.phone,
    location: validatedFields.data.location,
    website: validatedFields.data.website || null,
    skills: validatedFields.data.skills,
    experience: validatedFields.data.experience,
  }).eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile', 'page')
  return { success: true, message: 'Profile updated successfully' }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const file = formData.get('avatar') as File

  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be less than 5MB' }
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await (supabase.storage as any)
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    logger.error('Upload error:', uploadError)
    return { error: 'Failed to upload avatar' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update profile with new avatar URL
  const { error: updateError } = await (supabase.from('profiles') as any)
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/dashboard/profile', 'page')
  return { success: true, avatarUrl: publicUrl }
}

export async function resendVerificationEmail() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email!,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Verification email sent' }
}

export async function deleteAccount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Soft delete profile (set deleted_at)
  const { error: profileError } = await (supabase.from('profiles') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Failed to delete account' }
  }

  // Sign out user
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/?success=Account deleted successfully')
}

