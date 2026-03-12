import { createClient } from '@/lib/auth/config'

// Types for check-in features
export interface CheckinStation {
  id: string
  event_id: string
  name: string
  location?: string
  station_type: 'manual' | 'kiosk' | 'mobile'
  is_active: boolean
  created_at: string
}

export interface CheckinRecord {
  id: string
  registration_id: string
  station_id: string
  checked_in_by: string
  checkin_time: string
  method: 'qr_scan' | 'manual' | 'walk_in'
  notes?: string
  registration?: {
    id: string
    registration_number: string
    attendee: {
      name: string
      email: string
    }
  }
  station?: {
    id: string
    name: string
    location?: string
  }
}

export interface BadgePrint {
  id: string
  registration_id: string
  status: 'pending' | 'printed' | 'failed'
  print_queue_position: number
  requested_at: string
  printed_at?: string
  badge_type?: string
}

export interface WalkinRegistration {
  id: string
  event_id: string
  attendee_name: string
  attendee_email: string
  attendee_phone: string
  ticket_type_id: string
  payment_status: 'pending' | 'paid'
  payment_amount: number
  checked_in: boolean
  created_at: string
}

export interface ExpressLaneEligibility {
  user_id: string
  event_id: string
  eligible: boolean
  reason: string
  lane_number?: number
}

export interface TicketRecoveryRequest {
  id: string
  user_id: string
  event_id: string
  verification_method: 'email' | 'phone' | 'id_verification'
  verification_data: string
  status: 'pending' | 'verified' | 'approved' | 'rejected'
  recovery_token: string
  expires_at: string
  created_at: string
}

// Check-in Stations
export async function getCheckinStations(eventId: string): Promise<CheckinStation[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('checkin_stations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  return (data as CheckinStation[]) || []
}

export async function createCheckinStation(data: {
  event_id: string
  name: string
  location?: string
  station_type: 'manual' | 'kiosk' | 'mobile'
}): Promise<CheckinStation | null> {
  const supabase = await createClient()

  const { data: station } = await (supabase
    .from('checkin_stations') as any)
    .insert({
      event_id: data.event_id,
      name: data.name,
      location: data.location,
      station_type: data.station_type,
      is_active: true,
    })
    .select()
    .single()

  return station as CheckinStation | null
}

export async function updateCheckinStation(
  stationId: string,
  updates: Partial<CheckinStation>
): Promise<CheckinStation | null> {
  const supabase = await createClient()

  const { data: station } = await (supabase
    .from('checkin_stations') as any)
    .update(updates)
    .eq('id', stationId)
    .select()
    .single()

  return station as CheckinStation | null
}

export async function deleteCheckinStation(stationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('checkin_stations')
    .delete()
    .eq('id', stationId)

  return !error
}

// Check-in Records
export async function createCheckinRecord(data: {
  registration_id: string
  station_id: string
  checked_in_by: string
  method: 'qr_scan' | 'manual' | 'walk_in'
  notes?: string
}): Promise<CheckinRecord | null> {
  const supabase = await createClient()

  const { data: record } = await (supabase
    .from('checkin_records') as any)
    .insert({
      registration_id: data.registration_id,
      station_id: data.station_id,
      checked_in_by: data.checked_in_by,
      checkin_time: new Date().toISOString(),
      method: data.method,
      notes: data.notes,
    })
    .select(`
      *,
      registration:registration_id(
        id,
        registration_number,
        registration_attendees(name, email)
      ),
      station:station_id(id, name, location)
    `)
    .single()

  // Update registration checked_in_at
  if (record) {
    await (supabase
      .from('registrations') as any)
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', data.registration_id)
  }

  return record as CheckinRecord | null
}

export async function getCheckinRecords(params: {
  event_id: string
  station_id?: string
  limit?: number
  offset?: number
}): Promise<{ records: CheckinRecord[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('checkin_records')
    .select('*, registrations(event_id)', { count: 'exact' })
    .order('checkin_time', { ascending: false })

  // Filter by event_id through registrations
  query = query.eq('registrations.event_id', params.event_id)

  if (params.station_id) {
    query = query.eq('station_id', params.station_id)
  }

  if (params.limit) {
    const start = params.offset || 0
    const end = start + params.limit - 1
    query = query.range(start, end)
  }

  const { data, count } = await query

  return {
    records: (data as CheckinRecord[]) || [],
    total: count || 0,
  }
}

export async function getCheckinStats(eventId: string): Promise<{
  total: number
  checked_in: number
  pending: number
  by_station: { station_name: string; count: number }[]
}> {
  const supabase = await createClient()

  // Get total registrations
  const { count: total } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  // Get checked in count
  const { count: checked_in } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('checked_in_at', 'is', null)

  // Get check-ins by station
  const { data: stationData } = await supabase
    .from('checkin_records')
    .select('station_id, checkin_stations(name)')
    .eq('registrations.event_id', eventId)

  const byStation = new Map<string, number>()
  stationData?.forEach((record: any) => {
    const stationName = record.checkin_stations?.name || 'Unknown'
    byStation.set(stationName, (byStation.get(stationName) || 0) + 1)
  })

  return {
    total: total || 0,
    checked_in: checked_in || 0,
    pending: (total || 0) - (checked_in || 0),
    by_station: Array.from(byStation.entries()).map(([station_name, count]) => ({
      station_name,
      count,
    })),
  }
}

export async function undoCheckin(registrationId: string): Promise<boolean> {
  const supabase = await createClient()

  // Delete check-in record
  const { error: deleteError } = await supabase
    .from('checkin_records')
    .delete()
    .eq('registration_id', registrationId)

  // Update registration
  const { error: updateError } = await (supabase
    .from('registrations') as any)
    .update({ checked_in_at: null })
    .eq('id', registrationId)

  return !deleteError && !updateError
}

// Badge Printing
export async function requestBadgePrint(registrationId: string, badgeType?: string): Promise<BadgePrint | null> {
  const supabase = await createClient()

  // Get current queue position
  const { data: lastPrint } = await (supabase
    .from('badge_prints') as any)
    .select('print_queue_position')
    .eq('status', 'pending')
    .order('print_queue_position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (lastPrint?.print_queue_position || 0) + 1

  const { data: badge } = await (supabase
    .from('badge_prints') as any)
    .insert({
      registration_id: registrationId,
      status: 'pending',
      print_queue_position: nextPosition,
      requested_at: new Date().toISOString(),
      badge_type: badgeType,
    })
    .select()
    .single()

  return badge as BadgePrint | null
}

export async function getBadgeQueue(params: {
  event_id?: string
  status?: string
  limit?: number
}): Promise<BadgePrint[]> {
  const supabase = await createClient()

  let query = supabase
    .from('badge_prints')
    .select('*, registrations(event_id)')
    .order('print_queue_position', { ascending: true })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data } = await query

  // Filter by event_id if provided
  let filteredData = data as BadgePrint[]
  if (params.event_id) {
    filteredData = filteredData.filter((b: any) => b.registrations?.event_id === params.event_id)
  }

  return filteredData
}

export async function markBadgePrinted(badgeId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('badge_prints') as any)
    .update({
      status: 'printed',
      printed_at: new Date().toISOString(),
    })
    .eq('id', badgeId)

  return !error
}

// Walk-in Registration
export async function createWalkinRegistration(data: {
  event_id: string
  attendee_name: string
  attendee_email: string
  attendee_phone: string
  ticket_type_id: string
  payment_amount: number
}): Promise<WalkinRegistration | null> {
  const supabase = await createClient()

  const { data: walkin } = await (supabase
    .from('walkin_registrations') as any)
    .insert({
      event_id: data.event_id,
      attendee_name: data.attendee_name,
      attendee_email: data.attendee_email,
      attendee_phone: data.attendee_phone,
      ticket_type_id: data.ticket_type_id,
      payment_status: 'pending',
      payment_amount: data.payment_amount,
      checked_in: false,
    })
    .select()
    .single()

  return walkin as WalkinRegistration | null
}

export async function getWalkinRegistrations(eventId: string): Promise<WalkinRegistration[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('walkin_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  return (data as WalkinRegistration[]) || []
}

export async function checkinWalkin(walkinId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('walkin_registrations') as any)
    .update({ checked_in: true })
    .eq('id', walkinId)

  return !error
}

// Express Lanes
export async function checkExpressLaneEligibility(
  userId: string,
  eventId: string
): Promise<ExpressLaneEligibility> {
  const supabase = await createClient()

  // Check if user has early bird ticket
  const { data: registration } = await supabase
    .from('registrations')
    .select(`
      *,
      ticket_types(name, price)
    `)
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single()

  if (registration) {
    const ticketName = (registration as any).ticket_types?.name || ''

    if (ticketName.toLowerCase().includes('vip') || ticketName.toLowerCase().includes('early bird')) {
      return {
        user_id: userId,
        event_id: eventId,
        eligible: true,
        reason: ticketName.toLowerCase().includes('vip') ? 'VIP ticket holder' : 'Early bird ticket holder',
        lane_number: ticketName.toLowerCase().includes('vip') ? 1 : 2,
      }
    }
  }

  // Check if user is a volunteer
  const { data: volunteer } = await supabase
    .from('volunteer_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .single()

  if (volunteer) {
    return {
      user_id: userId,
      event_id: eventId,
      eligible: true,
      reason: 'Event volunteer',
      lane_number: 3,
    }
  }

  return {
    user_id: userId,
    event_id: eventId,
    eligible: false,
    reason: 'Standard check-in required',
  }
}

export async function getExpressLaneStations(eventId: string): Promise<CheckinStation[]> {
  const supabase = await createClient()

  // Get stations designated for express lanes
  const { data } = await supabase
    .from('checkin_stations')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Return only first 2 stations as express lanes
  return ((data as CheckinStation[]) || []).slice(0, 2)
}

// Ticket Recovery
export async function requestTicketRecovery(data: {
  user_id: string
  event_id: string
  verification_method: 'email' | 'phone' | 'id_verification'
  verification_data: string
}): Promise<TicketRecoveryRequest | null> {
  const supabase = await createClient()

  // Generate recovery token
  const recoveryToken = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // Token valid for 1 hour

  const { data: request } = await (supabase
    .from('ticket_recovery') as any)
    .insert({
      user_id: data.user_id,
      event_id: data.event_id,
      verification_method: data.verification_method,
      verification_data: data.verification_data,
      status: 'pending',
      recovery_token: recoveryToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  return request as TicketRecoveryRequest | null
}

export async function verifyTicketRecovery(recoveryToken: string): Promise<TicketRecoveryRequest | null> {
  const supabase = await createClient()

  const { data: recovery } = await (supabase
    .from('ticket_recovery') as any)
    .select('*')
    .eq('recovery_token', recoveryToken)
    .single()

  if (!recovery) {
    return null
  }

  // Check if token has expired
  if (new Date(recovery.expires_at) < new Date()) {
    await (supabase
      .from('ticket_recovery') as any)
      .update({ status: 'rejected' })
      .eq('id', recovery.id)

    return null
  }

  // Update status to verified
  const { data: updated } = await (supabase
    .from('ticket_recovery') as any)
    .update({ status: 'verified' })
    .eq('id', recovery.id)
    .select()
    .single()

  return updated as TicketRecoveryRequest | null
}

export async function approveTicketRecovery(recoveryId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('ticket_recovery') as any)
    .update({ status: 'approved' })
    .eq('id', recoveryId)

  return !error
}

export async function getRecoveryRequest(userId: string, eventId: string): Promise<TicketRecoveryRequest | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ticket_recovery')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data as TicketRecoveryRequest | null
}
