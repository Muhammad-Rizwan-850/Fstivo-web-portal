'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import * as preferencesQueries from '@/lib/database/queries/preferences'

/**
 * Get user preferences
 */
export async function getUserPreferences() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  let preferences = await preferencesQueries.getUserPreferences(user.id)

  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await preferencesQueries.createUserPreferences(user.id)
  }

  if (!preferences) {
    return { error: 'Failed to get user preferences' }
  }

  return { success: true, preferences }
}

/**
 * Update theme preference
 */
export async function updateTheme(theme: 'light' | 'dark' | 'system') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const validThemes = ['light', 'dark', 'system']
  if (!validThemes.includes(theme)) {
    return { error: 'Invalid theme' }
  }

  // Get or create preferences first
  let preferences = await preferencesQueries.getUserPreferences(user.id)
  if (!preferences) {
    preferences = await preferencesQueries.createUserPreferences(user.id)
  }

  const success = await preferencesQueries.updateTheme(user.id, theme)

  if (!success) {
    return { error: 'Failed to update theme' }
  }

  revalidatePath('/')
  revalidatePath('/profile/settings')
  return { success: true, theme }
}

/**
 * Update font size preference
 */
export async function updateFontSize(fontSize: 'small' | 'medium' | 'large' | 'xl') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const validFontSizes = ['small', 'medium', 'large', 'xl']
  if (!validFontSizes.includes(fontSize)) {
    return { error: 'Invalid font size' }
  }

  // Get or create preferences first
  let preferences = await preferencesQueries.getUserPreferences(user.id)
  if (!preferences) {
    preferences = await preferencesQueries.createUserPreferences(user.id)
  }

  const success = await preferencesQueries.updateFontSize(user.id, fontSize)

  if (!success) {
    return { error: 'Failed to update font size' }
  }

  revalidatePath('/')
  revalidatePath('/profile/settings')
  return { success: true, font_size: fontSize }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  notification_frequency: 'all' | 'important' | 'digest' | 'none'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const validFrequencies = ['all', 'important', 'digest', 'none']
  if (!validFrequencies.includes(preferences.notification_frequency)) {
    return { error: 'Invalid notification frequency' }
  }

  const success = await preferencesQueries.updateNotificationPreferences(user.id, preferences)

  if (!success) {
    return { error: 'Failed to update notification preferences' }
  }

  revalidatePath('/profile/settings')
  return { success: true, preferences }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(settings: {
  profile_visibility: 'public' | 'connections' | 'private'
  show_attending_events: boolean
  allow_friend_requests: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const validVisibilities = ['public', 'connections', 'private']
  if (!validVisibilities.includes(settings.profile_visibility)) {
    return { error: 'Invalid profile visibility' }
  }

  const success = await preferencesQueries.updatePrivacySettings(user.id, settings)

  if (!success) {
    return { error: 'Failed to update privacy settings' }
  }

  revalidatePath('/profile/settings')
  return { success: true, settings }
}

/**
 * Update accessibility settings
 */
export async function updateAccessibilitySettings(settings: {
  high_contrast: boolean
  reduced_motion: boolean
  screen_reader: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await preferencesQueries.updateAccessibilitySettings(user.id, settings)

  if (!success) {
    return { error: 'Failed to update accessibility settings' }
  }

  revalidatePath('/')
  revalidatePath('/profile/settings')
  return { success: true, settings }
}

/**
 * Update all preferences at once
 */
export async function updateAllPreferences(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const theme = formData.get('theme') as 'light' | 'dark' | 'system'
  const fontSize = formData.get('font_size') as 'small' | 'medium' | 'large' | 'xl'
  const language = formData.get('language') as string
  const timezone = formData.get('timezone') as string
  const currency = formData.get('currency') as string

  const notificationPreferences = {
    email_notifications: formData.get('email_notifications') === 'true',
    push_notifications: formData.get('push_notifications') === 'true',
    sms_notifications: formData.get('sms_notifications') === 'true',
    notification_frequency: formData.get('notification_frequency') as 'all' | 'important' | 'digest' | 'none',
  }

  const privacySettings = {
    profile_visibility: formData.get('profile_visibility') as 'public' | 'connections' | 'private',
    show_attending_events: formData.get('show_attending_events') === 'true',
    allow_friend_requests: formData.get('allow_friend_requests') === 'true',
  }

  const accessibilitySettings = {
    high_contrast: formData.get('high_contrast') === 'true',
    reduced_motion: formData.get('reduced_motion') === 'true',
    screen_reader: formData.get('screen_reader') === 'true',
  }

  const preferences = await preferencesQueries.getUserPreferences(user.id)

  if (preferences) {
    const updated = await preferencesQueries.updateUserPreferences(user.id, {
      theme,
      font_size: fontSize,
      language,
      timezone,
      currency,
      notification_preferences: notificationPreferences,
      privacy_settings: privacySettings,
      accessibility: accessibilitySettings,
    })

    if (!updated) {
      return { error: 'Failed to update preferences' }
    }

    revalidatePath('/')
    revalidatePath('/profile/settings')
    return { success: true, preferences: updated }
  }

  const created = await preferencesQueries.createUserPreferences(user.id, {
    theme,
    font_size: fontSize,
    language,
    timezone,
    currency,
    notification_preferences: notificationPreferences,
    privacy_settings: privacySettings,
    accessibility: accessibilitySettings,
  })

  if (!created) {
    return { error: 'Failed to create preferences' }
  }

  revalidatePath('/')
  revalidatePath('/profile/settings')
  return { success: true, preferences: created }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(subscription: any, deviceInfo?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const sub = await preferencesQueries.createPushSubscription({
    user_id: user.id,
    subscription,
    device_info: deviceInfo,
  })

  if (!sub) {
    return { error: 'Failed to subscribe to push notifications' }
  }

  return { success: true, subscription: sub }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(subscriptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await preferencesQueries.removePushSubscription(subscriptionId)

  if (!success) {
    return { error: 'Failed to unsubscribe from push notifications' }
  }

  return { success: true }
}

/**
 * Track PWA installation
 */
export async function trackPWAInstallation(deviceType: 'mobile' | 'tablet' | 'desktop', platform: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const installation = await preferencesQueries.trackPWAInstallation({
    user_id: user.id,
    device_type: deviceType,
    platform,
  })

  if (!installation) {
    return { error: 'Failed to track PWA installation' }
  }

  return { success: true, installation }
}

/**
 * Update PWA last used timestamp
 */
export async function updatePWAInstallationUsage(installationId: string) {
  const success = await preferencesQueries.updatePWAInstallationUsage(installationId)

  if (!success) {
    return { error: 'Failed to update installation usage' }
  }

  return { success: true }
}

/**
 * Cache offline ticket
 */
export async function cacheOfflineTicket(registrationId: string, ticketData: any, qrCodeUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const cached = await preferencesQueries.cacheOfflineTicket({
    user_id: user.id,
    registration_id: registrationId,
    ticket_data: ticketData,
    qr_code_url: qrCodeUrl,
  })

  if (!cached) {
    return { error: 'Failed to cache offline ticket' }
  }

  return { success: true, cached }
}

/**
 * Remove offline ticket
 */
export async function removeOfflineTicket(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await preferencesQueries.removeOfflineTicket(ticketId)

  if (!success) {
    return { error: 'Failed to remove offline ticket' }
  }

  return { success: true }
}

/**
 * Clear expired offline tickets
 */
export async function clearExpiredOfflineTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const count = await preferencesQueries.clearExpiredOfflineTickets(user.id)

  return { success: true, cleared: count }
}
