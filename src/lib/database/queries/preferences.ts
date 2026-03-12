import { createClient } from '@/lib/auth/config'

// Types for user preferences
export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  font_size: 'small' | 'medium' | 'large' | 'xl'
  language: string
  timezone: string
  currency: string
  notification_preferences: {
    email_notifications: boolean
    push_notifications: boolean
    sms_notifications: boolean
    notification_frequency: 'all' | 'important' | 'digest' | 'none'
  }
  privacy_settings: {
    profile_visibility: 'public' | 'connections' | 'private'
    show_attending_events: boolean
    allow_friend_requests: boolean
  }
  accessibility: {
    high_contrast: boolean
    reduced_motion: boolean
    screen_reader: boolean
  }
  created_at: string
  updated_at: string
}

export interface PWAPushSubscription {
  id: string
  user_id: string
  subscription: any // PushSubscription JSON
  device_info?: string
  active: boolean
  created_at: string
}

export interface PWAOfflineTicket {
  id: string
  user_id: string
  registration_id: string
  ticket_data: any
  qr_code_url: string
  cached_at: string
  expires_at: string
}

export interface PWAInstallation {
  id: string
  user_id: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  platform: string
  installed_at: string
  last_used: string
}

// User Preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data as UserPreferences | null
}

export async function createUserPreferences(
  userId: string,
  preferences?: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  const supabase = await createClient()

  const { data: prefs } = await (supabase
    .from('user_preferences') as any)
    .insert({
      user_id: userId,
      theme: preferences?.theme || 'system',
      font_size: preferences?.font_size || 'medium',
      language: preferences?.language || 'en',
      timezone: preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: preferences?.currency || 'PKR',
      notification_preferences: preferences?.notification_preferences || {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'important',
      },
      privacy_settings: preferences?.privacy_settings || {
        profile_visibility: 'public',
        show_attending_events: true,
        allow_friend_requests: true,
      },
      accessibility: preferences?.accessibility || {
        high_contrast: false,
        reduced_motion: false,
        screen_reader: false,
      },
    })
    .select()
    .single()

  return prefs as UserPreferences | null
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  const supabase = await createClient()

  const { data: prefs } = await (supabase
    .from('user_preferences') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  return prefs as UserPreferences | null
}

export async function updateTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('user_preferences') as any)
    .update({ theme, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return !error
}

export async function updateFontSize(
  userId: string,
  fontSize: 'small' | 'medium' | 'large' | 'xl'
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('user_preferences') as any)
    .update({ font_size: fontSize, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return !error
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: UserPreferences['notification_preferences']
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('user_preferences') as any)
    .update({
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return !error
}

export async function updatePrivacySettings(
  userId: string,
  settings: UserPreferences['privacy_settings']
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('user_preferences') as any)
    .update({
      privacy_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return !error
}

export async function updateAccessibilitySettings(
  userId: string,
  settings: UserPreferences['accessibility']
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('user_preferences') as any)
    .update({
      accessibility: settings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return !error
}

// PWA Push Subscriptions
export async function getPushSubscriptions(userId: string): Promise<PWAPushSubscription[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pwa_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  return (data as PWAPushSubscription[]) || []
}

export async function createPushSubscription(data: {
  user_id: string
  subscription: any
  device_info?: string
}): Promise<PWAPushSubscription | null> {
  const supabase = await createClient()

  const { data: sub } = await (supabase
    .from('pwa_push_subscriptions') as any)
    .insert({
      user_id: data.user_id,
      subscription: data.subscription,
      device_info: data.device_info,
      active: true,
    })
    .select()
    .single()

  return sub as PWAPushSubscription | null
}

export async function removePushSubscription(subscriptionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('pwa_push_subscriptions') as any)
    .update({ active: false })
    .eq('id', subscriptionId)

  return !error
}

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    data?: any
  }
): Promise<boolean> {
  const supabase = await createClient()

  // Get active subscriptions
  const { data: subscriptions } = await supabase
    .from('pwa_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (!subscriptions || subscriptions.length === 0) {
    return false
  }

  // This would normally use web-push library to send notifications
  // For now, we'll store the notification in a notifications table
  // and let the service worker handle it

  return true
}

// PWA Offline Tickets
export async function cacheOfflineTicket(data: {
  user_id: string
  registration_id: string
  ticket_data: any
  qr_code_url: string
}): Promise<PWAOfflineTicket | null> {
  const supabase = await createClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Cache for 7 days

  const { data: cached } = await (supabase
    .from('pwa_offline_tickets') as any)
    .insert({
      user_id: data.user_id,
      registration_id: data.registration_id,
      ticket_data: data.ticket_data,
      qr_code_url: data.qr_code_url,
      cached_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  return cached as PWAOfflineTicket | null
}

export async function getOfflineTickets(userId: string): Promise<PWAOfflineTicket[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pwa_offline_tickets')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('cached_at', { ascending: false })

  return (data as PWAOfflineTicket[]) || []
}

export async function removeOfflineTicket(ticketId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pwa_offline_tickets')
    .delete()
    .eq('id', ticketId)

  return !error
}

export async function clearExpiredOfflineTickets(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pwa_offline_tickets')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .eq('user_id', userId)
    .select()

  return (data?.length) || 0
}

// PWA Installations
export async function trackPWAInstallation(data: {
  user_id: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  platform: string
}): Promise<PWAInstallation | null> {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const { data: install } = await (supabase
    .from('pwa_installations') as any)
    .insert({
      user_id: data.user_id,
      device_type: data.device_type,
      platform: data.platform,
      installed_at: now,
      last_used: now,
    })
    .select()
    .single()

  return install as PWAInstallation | null
}

export async function updatePWAInstallationUsage(installationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('pwa_installations') as any)
    .update({ last_used: new Date().toISOString() })
    .eq('id', installationId)

  return !error
}

export async function getPWAInstallations(userId: string): Promise<PWAInstallation[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pwa_installations')
    .select('*')
    .eq('user_id', userId)
    .order('installed_at', { ascending: false })

  return (data as PWAInstallation[]) || []
}

export async function getPWAInstallStats(): Promise<{
  total_installations: number
  installations_by_device: { device_type: string; count: number }[]
  installations_by_platform: { platform: string; count: number }[]
}> {
  const supabase = await createClient()

  const { data: installations } = await supabase
    .from('pwa_installations')
    .select('*')

  if (!installations) {
    return {
      total_installations: 0,
      installations_by_device: [],
      installations_by_platform: [],
    }
  }

  const deviceCounts = new Map<string, number>()
  const platformCounts = new Map<string, number>()

  installations.forEach((install: any) => {
    const device = install.device_type
    const platform = install.platform

    deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1)
    platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1)
  })

  return {
    total_installations: installations.length,
    installations_by_device: Array.from(deviceCounts.entries()).map(([device_type, count]) => ({
      device_type,
      count,
    })),
    installations_by_platform: Array.from(platformCounts.entries()).map(([platform, count]) => ({
      platform,
      count,
    })),
  }
}
