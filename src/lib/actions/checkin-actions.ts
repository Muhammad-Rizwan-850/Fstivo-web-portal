'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import * as checkinQueries from '@/lib/database/queries/checkin'

/**
 * Create check-in station (organizer/admin only)
 */
export async function createCheckinStation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is organizer or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || ((profile as any).role !== 'organizer' && (profile as any).role !== 'admin')) {
    return { error: 'Only organizers and admins can create check-in stations' }
  }

  const eventId = formData.get('event_id') as string
  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const stationType = formData.get('station_type') as 'manual' | 'kiosk' | 'mobile'

  if (!eventId || !name || !stationType) {
    return { error: 'Event ID, name, and station type are required' }
  }

  const station = await checkinQueries.createCheckinStation({
    event_id: eventId,
    name,
    location: location || undefined,
    station_type: stationType,
  })

  if (!station) {
    return { error: 'Failed to create check-in station' }
  }

  revalidatePath(`/events/${eventId}/checkin`)
  return { success: true, station }
}

/**
 * Update check-in station
 */
export async function updateCheckinStation(stationId: string, updates: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const station = await checkinQueries.updateCheckinStation(stationId, updates)

  if (!station) {
    return { error: 'Failed to update check-in station' }
  }

  revalidatePath(`/events/${station.event_id}/checkin`)
  return { success: true, station }
}

/**
 * Delete check-in station
 */
export async function deleteCheckinStation(stationId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await checkinQueries.deleteCheckinStation(stationId)

  if (!success) {
    return { error: 'Failed to delete check-in station' }
  }

  revalidatePath(`/events/${eventId}/checkin`)
  return { success: true }
}

/**
 * Check in attendee via QR code scan
 */
export async function scanAndCheckIn(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const registrationNumber = formData.get('registration_number') as string
  const stationId = formData.get('station_id') as string
  const notes = formData.get('notes') as string

  if (!registrationNumber || !stationId) {
    return { error: 'Registration number and station ID are required' }
  }

  // Get registration by number
  const { data: registration } = await supabase
    .from('registrations')
    .select('id, checked_in_at')
    .eq('registration_number', registrationNumber)
    .single()

  if (!registration) {
    return { error: 'Registration not found' }
  }

  if ((registration as any).checked_in_at) {
    return { error: 'Attendee already checked in' }
  }

  const record = await checkinQueries.createCheckinRecord({
    registration_id: (registration as any).id,
    station_id: stationId,
    checked_in_by: user.id,
    method: 'qr_scan',
    notes: notes || undefined,
  })

  if (!record) {
    return { error: 'Failed to check in attendee' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true, record }
}

/**
 * Manual check-in
 */
export async function manualCheckIn(registrationId: string, stationId: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if already checked in
  const { data: registration } = await supabase
    .from('registrations')
    .select('checked_in_at')
    .eq('id', registrationId)
    .single()

  if (!registration) {
    return { error: 'Registration not found' }
  }

  if ((registration as any).checked_in_at) {
    return { error: 'Attendee already checked in' }
  }

  const record = await checkinQueries.createCheckinRecord({
    registration_id: registrationId,
    station_id: stationId,
    checked_in_by: user.id,
    method: 'manual',
    notes,
  })

  if (!record) {
    return { error: 'Failed to check in attendee' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true, record }
}

/**
 * Undo check-in
 */
export async function undoCheckIn(registrationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await checkinQueries.undoCheckin(registrationId)

  if (!success) {
    return { error: 'Failed to undo check-in' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true }
}

/**
 * Request badge print
 */
export async function requestBadgePrint(registrationId: string, badgeType?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const badge = await checkinQueries.requestBadgePrint(registrationId, badgeType)

  if (!badge) {
    return { error: 'Failed to request badge print' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true, badge }
}

/**
 * Mark badge as printed
 */
export async function markBadgePrinted(badgeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await checkinQueries.markBadgePrinted(badgeId)

  if (!success) {
    return { error: 'Failed to mark badge as printed' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true }
}

/**
 * Create walk-in registration
 */
export async function createWalkinRegistration(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const eventId = formData.get('event_id') as string
  const attendeeName = formData.get('attendee_name') as string
  const attendeeEmail = formData.get('attendee_email') as string
  const attendeePhone = formData.get('attendee_phone') as string
  const ticketTypeId = formData.get('ticket_type_id') as string
  const paymentAmount = parseFloat(formData.get('payment_amount') as string)

  if (!eventId || !attendeeName || !attendeeEmail || !ticketTypeId) {
    return { error: 'Missing required fields' }
  }

  const walkin = await checkinQueries.createWalkinRegistration({
    event_id: eventId,
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
    attendee_phone: attendeePhone,
    ticket_type_id: ticketTypeId,
    payment_amount: paymentAmount || 0,
  })

  if (!walkin) {
    return { error: 'Failed to create walk-in registration' }
  }

  revalidatePath(`/events/${eventId}/checkin`)
  return { success: true, walkin }
}

/**
 * Check in walk-in registrant
 */
export async function checkinWalkin(walkinId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await checkinQueries.checkinWalkin(walkinId)

  if (!success) {
    return { error: 'Failed to check in walk-in' }
  }

  revalidatePath(`/events/[eventId]/checkin`)
  return { success: true }
}

/**
 * Check express lane eligibility
 */
export async function checkExpressLaneEligibility(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const eligibility = await checkinQueries.checkExpressLaneEligibility(user.id, eventId)

  return { success: true, eligibility }
}

/**
 * Request ticket recovery
 */
export async function requestTicketRecovery(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const eventId = formData.get('event_id') as string
  const verificationMethod = formData.get('verification_method') as 'email' | 'phone' | 'id_verification'
  const verificationData = formData.get('verification_data') as string

  if (!eventId || !verificationMethod || !verificationData) {
    return { error: 'Event ID, verification method, and data are required' }
  }

  const request = await checkinQueries.requestTicketRecovery({
    user_id: user.id,
    event_id: eventId,
    verification_method: verificationMethod,
    verification_data: verificationData,
  })

  if (!request) {
    return { error: 'Failed to submit recovery request' }
  }

  revalidatePath(`/events/${eventId}/tickets`)
  return { success: true, request }
}

/**
 * Verify ticket recovery token
 */
export async function verifyTicketRecovery(recoveryToken: string) {
  const recovery = await checkinQueries.verifyTicketRecovery(recoveryToken)

  if (!recovery) {
    return { error: 'Invalid or expired recovery token' }
  }

  return { success: true, recovery }
}

/**
 * Approve ticket recovery (admin only)
 */
export async function approveTicketRecovery(recoveryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'admin') {
    return { error: 'Only admins can approve recovery requests' }
  }

  const success = await checkinQueries.approveTicketRecovery(recoveryId)

  if (!success) {
    return { error: 'Failed to approve recovery request' }
  }

  revalidatePath('/admin/ticket-recovery')
  return { success: true }
}

/**
 * Get check-in statistics
 */
export async function getCheckinStats(eventId: string) {
  const stats = await checkinQueries.getCheckinStats(eventId)

  return { success: true, stats }
}
