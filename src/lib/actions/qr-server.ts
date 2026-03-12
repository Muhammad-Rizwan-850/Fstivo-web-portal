'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logger } from '@/lib/logger';
import {
  generateRegistrationQRCode,
  generateCheckInQRCode,
  generateQRCodeDataURL,
  generateStyledQRCodeSVG,
  isValidQRCodeData,
  extractRegistrationIdFromQR,
  getQROptionsForUseCase,
  type QRCodeOptions,
  type StyledQRCodeOptions,
} from '@/lib/qr/generate'
import {
  getCachedQRCode,
  getCachedQRCodeDataURL,
  invalidateQRCode,
} from '@/lib/qr/cache'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GenerateQRCodeRequest {
  registration_id: string
  format?: 'png' | 'svg' | 'dataurl'
  size?: number
  style?: 'simple' | 'styled'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const generateQRCodeSchema = z.object({
  registration_id: z.string().uuid('Invalid registration ID'),
  format: z.enum(['png', 'svg', 'dataurl']).optional(),
  size: z.number().int().positive().optional(),
  style: z.enum(['simple', 'styled']).optional(),
})

// ============================================================================
// QR CODE SERVER ACTIONS
// ============================================================================

/**
 * Generate QR code for a registration
 */
export async function generateRegistrationQRCodeAction(formData: GenerateQRCodeRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate input
  const validatedFields = generateQRCodeSchema.safeParse(formData)
  if (!validatedFields.success) {
    return { error: 'Invalid input', details: validatedFields.error.flatten() }
  }

  const { registration_id, format = 'png', size = 300, style = 'styled' } = validatedFields.data

  // Get registration
  const { data: registration, error } = await (supabase.from('registrations') as any)
    .select(`
      *,
      user:user_id(id, email),
      event:event_id(id, title),
      ticket_type:ticket_type_id(id, name)
    `)
    .eq('id', registration_id)
    .single()

  if (error || !registration) {
    return { error: 'Registration not found' }
  }

  // Check permissions (user must be the registrant or the event organizer)
  if (registration.user_id !== user.id) {
    const { data: event } = await (supabase.from('events') as any)
      .select('organizer_id')
      .eq('id', registration.event_id)
      .single()

    if (event?.organizer_id !== user.id) {
      return { error: 'You do not have permission to view this QR code' }
    }
  }

  try {
    const qrData = registration.qr_code
    if (!qrData) {
      return { error: 'QR code not found for this registration' }
    }

    const eventTitle = registration.event.title

    // Generate based on format
    if (format === 'svg' || style === 'styled') {
      const svg = await generateStyledQRCodeSVG(qrData, {
        title: 'Your Ticket',
        subtitle: eventTitle.length > 30 ? eventTitle.substring(0, 30) + '...' : eventTitle,
        width: size,
      })

      return {
        success: true,
        format: 'svg',
        data: svg,
        registration: {
          id: registration.id,
          registration_number: registration.registration_number,
          event_title: eventTitle,
        },
      }
    }

    if (format === 'dataurl') {
      const dataURL = await generateQRCodeDataURL(qrData, { width: size })

      return {
        success: true,
        format: 'dataurl',
        data: dataURL,
        registration: {
          id: registration.id,
          registration_number: registration.registration_number,
          event_title: eventTitle,
        },
      }
    }

    // Default: PNG
    const cacheKey = `qr:registration:${registration_id}:${size}`

    const buffer = await getCachedQRCode(cacheKey, async () => {
      const { generateQRCodeBuffer } = await import('@/lib/qr/generate')
      return generateQRCodeBuffer(qrData, { width: size })
    })

    // Convert buffer to base64 for JSON response
    const base64 = buffer.toString('base64')

    return {
      success: true,
      format: 'png',
      data: base64,
      registration: {
        id: registration.id,
        registration_number: registration.registration_number,
        event_title: eventTitle,
      },
    }
  } catch (error) {
    logger.error('[QR] Failed to generate registration QR code:', error)
    return { error: 'Failed to generate QR code' }
  }
}

/**
 * Get QR code data URL for display (lightweight)
 */
export async function getRegistrationQRDataURLAction(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get registration
  const { data: registration, error } = await (supabase.from('registrations') as any)
    .select('qr_code, user_id, event_id')
    .eq('id', registrationId)
    .single()

  if (error || !registration) {
    return { error: 'Registration not found' }
  }

  // Check permissions
  if (registration.user_id !== user.id) {
    const { data: event } = await (supabase.from('events') as any)
      .select('organizer_id')
      .eq('id', registration.event_id)
      .single()

    if (event?.organizer_id !== user.id) {
      return { error: 'You do not have permission to view this QR code' }
    }
  }

  try {
    const cacheKey = `qr:dataurl:${registrationId}`

    const dataURL = await getCachedQRCodeDataURL(cacheKey, async () => {
      return generateQRCodeDataURL(registration.qr_code)
    })

    return {
      success: true,
      dataURL,
    }
  } catch (error) {
    logger.error('[QR] Failed to get QR code data URL:', error)
    return { error: 'Failed to generate QR code' }
  }
}

/**
 * Verify QR code and return registration details
 * Used by check-in scanner
 */
export async function verifyQRCodeAction(qrData: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Validate QR code format
  if (!isValidQRCodeData(qrData)) {
    return { error: 'Invalid QR code format' }
  }

  // Extract registration ID
  const registrationId = extractRegistrationIdFromQR(qrData)
  if (!registrationId) {
    return { error: 'Could not extract registration ID from QR code' }
  }

  // Get registration
  const { data: registration, error } = await (supabase.from('registrations') as any)
    .select(`
      *,
      user:user_id(id, full_name, email, avatar_url, phone),
      event:event_id(id, title, start_date, end_date, venue_name, venue_city, organizer_id),
      ticket_type:ticket_type_id(id, name, price)
    `)
    .eq('qr_code', qrData)
    .single()

  if (error || !registration) {
    return { error: 'Registration not found' }
  }

  // Verify organizer permissions
  if (registration.event.organizer_id !== user.id) {
    return { error: 'You do not have permission to verify this QR code' }
  }

  // Check if registration is confirmed
  if (registration.status !== 'confirmed' && registration.status !== 'attended') {
    return {
      error: 'Registration not confirmed',
      status: registration.status,
      canCheckIn: false,
    }
  }

  // Check if already checked in
  const isCheckedIn = !!registration.checked_in_at

  return {
    success: true,
    registration: {
      id: registration.id,
      registration_number: registration.registration_number,
      status: registration.status,
      checked_in_at: registration.checked_in_at,
      can_check_in: !isCheckedIn,
      attendee: {
        name: registration.user.full_name,
        email: registration.user.email,
        phone: registration.user.phone,
        avatar_url: registration.user.avatar_url,
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
        start_date: registration.event.start_date,
        end_date: registration.event.end_date,
        venue_name: registration.event.venue_name,
        venue_city: registration.event.venue_city,
      },
      ticket_type: registration.ticket_type,
    },
    canCheckIn: !isCheckedIn,
    isCheckedIn,
  }
}

/**
 * Generate QR codes for all registrations of an event (for organizer)
 */
export async function generateEventQRCodeBatchAction(eventId: string, options?: { size?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Verify organizer permissions
  const { data: event } = await (supabase.from('events') as any)
    .select('organizer_id, title')
    .eq('id', eventId)
    .single()

  if (!event || event.organizer_id !== user.id) {
    return { error: 'You do not have permission to access this event' }
  }

  // Get all confirmed registrations
  const { data: registrations, error } = await (supabase.from('registrations') as any)
    .select('id, qr_code, registration_number, user_id')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended'])

  if (error) {
    return { error: 'Failed to fetch registrations' }
  }

  if (!registrations || registrations.length === 0) {
    return { error: 'No registrations found', count: 0 }
  }

  try {
    const size = options?.size || 300
    const { generateQRCodeBuffer } = await import('@/lib/qr/generate')
    const qrcodes: Array<{ id: string; registration_number: string; data: string }> = []

    for (const registration of registrations) {
      if (!registration.qr_code) continue

      const cacheKey = `qr:registration:${registration.id}:${size}`

      const buffer = await getCachedQRCode(cacheKey, async () => {
        return generateQRCodeBuffer(registration.qr_code, { width: size })
      })

      qrcodes.push({
        id: registration.id,
        registration_number: registration.registration_number,
        data: buffer.toString('base64'),
      })
    }

    return {
      success: true,
      qrcodes,
      count: qrcodes.length,
      event: {
        id: eventId,
        title: event.title,
      },
    }
  } catch (error) {
    logger.error('[QR] Failed to generate batch QR codes:', error)
    return { error: 'Failed to generate QR codes' }
  }
}

/**
 * Download QR code as image file
 */
export async function downloadQRCodeAction(registrationId: string) {
  const result = await generateRegistrationQRCodeAction({
    registration_id: registrationId,
    format: 'png',
    size: 600,
    style: 'styled',
  })

  if (!result.success) {
    return result
  }

  // Return data URL for client-side download
  return {
    success: true,
    downloadUrl: `data:image/png;base64,${result.data}`,
    filename: `ticket-${registrationId}.png`,
  }
}

/**
 * Preload QR codes for an event into cache
 * Useful for improving performance before events
 */
export async function preloadEventQRCodesAction(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Verify organizer permissions
  const { data: event } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!event || event.organizer_id !== user.id) {
    return { error: 'You do not have permission to access this event' }
  }

  // Get all confirmed registrations
  const { data: registrations } = await (supabase.from('registrations') as any)
    .select('qr_code')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended'])

  if (!registrations || registrations.length === 0) {
    return { success: true, preloaded: 0, message: 'No registrations to preload' }
  }

  try {
    const { preloadQRCodes } = await import('@/lib/qr/cache')
    const qrCodes = registrations.map((r: any) => r.qr_code).filter(Boolean)

    const result = await preloadQRCodes(qrCodes, { size: 300 })

    return {
      success: true,
      preloaded: result.success,
      failed: result.failed,
      message: `Preloaded ${result.success} QR codes`,
    }
  } catch (error) {
    logger.error('[QR] Failed to preload QR codes:', error)
    return { error: 'Failed to preload QR codes' }
  }
}

/**
 * Invalidate QR code cache (e.g., after updating registration)
 */
export async function invalidateQRCodeCacheAction(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Get registration
  const { data: registration } = await (supabase.from('registrations') as any)
    .select('user_id, event_id')
    .eq('id', registrationId)
    .single()

  if (!registration) {
    return { error: 'Registration not found' }
  }

  // Check permissions
  if (registration.user_id !== user.id) {
    const { data: event } = await (supabase.from('events') as any)
      .select('organizer_id')
      .eq('id', registration.event_id)
      .single()

    if (event?.organizer_id !== user.id) {
      return { error: 'You do not have permission' }
    }
  }

  // Invalidate all cache keys for this registration
  const cacheKeys = [
    `qr:registration:${registrationId}`,
    `qr:dataurl:${registrationId}`,
  ]

  cacheKeys.forEach(key => invalidateQRCode(key))

  return { success: true, message: 'Cache invalidated' }
}

/**
 * Get QR code cache statistics
 */
export async function getQRCodeCacheStatsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Only admins can view cache stats
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'You do not have permission' }
  }

  const { getQRCodeCacheStats } = await import('@/lib/qr/cache')
  const stats = getQRCodeCacheStats()

  return {
    success: true,
    stats,
  }
}
