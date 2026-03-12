import { createClient } from '@/lib/auth/config'
import type { Registration, Attendee, RegistrationInput, TicketType } from '@/lib/types'
import { logger } from '@/lib/logger';

export async function getEventRegistrations(eventId: string): Promise<Registration[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  return (data as Registration[]) || []
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('registrations')
    .select('*, events(*)')
    .eq('user_id', userId)
    .order('registered_at', { ascending: false })

  return (data as Registration[]) || []
}

export async function createRegistration(registration: Partial<Registration>): Promise<Registration | null> {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('registrations') as any)
    .insert(registration)
    .select()
    .single()

  return data as Registration | null
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: Registration['status']
): Promise<Registration | null> {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('registrations') as any)
    .update({ status })
    .eq('id', registrationId)
    .select()
    .single()

  return data as Registration | null
}

export async function checkInUser(registrationId: string): Promise<Registration | null> {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('registrations') as any)
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select()
    .single()

  return data as Registration | null
}

// Event Registration Functions

export interface TicketWithAvailability extends TicketType {
  available: number
}

export async function getEventTickets(eventId: string): Promise<TicketWithAvailability[]> {
  const supabase = await createClient()

  const { data: tickets } = await (supabase
    .from('ticket_types') as any)
    .select('id, name, price, quantity_available, quantity_sold')
    .eq('event_id', eventId)
    .order('price', { ascending: true })

  if (!tickets) return []

  // Calculate available tickets
  return tickets.map((ticket: any) => ({
    id: ticket.id,
    name: ticket.name,
    price: ticket.price,
    currency: 'PKR',
    quantity_available: ticket.quantity_available,
    quantity_sold: ticket.quantity_sold || 0,
    available: (ticket.quantity_available || 0) - (ticket.quantity_sold || 0)
  }))
}

export async function createEventRegistration(
  userId: string,
  input: RegistrationInput
): Promise<{ registration: Registration; attendees: Attendee[] } | null> {
  const supabase = await createClient()

  // Create registration
  const { data: registration, error: regError } = await (supabase
    .from('registrations') as any)
    .insert({
      event_id: input.event_id,
      user_id: userId,
      ticket_type_id: input.ticket_type_id,
      quantity: input.quantity || 1,
      total_amount: input.total_amount,
      payment_method: input.payment_method,
      payment_status: 'pending',
      status: 'pending'
    })
    .select()
    .single()

  if (regError || !registration) {
    logger.error('Registration error:', regError)
    return null
  }

  // Update ticket sold count
  if (input.ticket_type_id) {
    try {
      await (supabase.rpc as any)('increment_ticket_sold', {
        ticket_id: input.ticket_type_id,
        quantity: input.quantity || 1
      })
    } catch {
      // Ignore error if RPC doesn't exist
      logger.info('RPC increment_ticket_sold not available, skipping ticket count update')
    }
  }

  // Create attendees
  let attendees: Attendee[] = []
  if (input.attendees && input.attendees.length > 0) {
    const attendeeData = input.attendees.map((attendee: any) => ({
      registration_id: registration.id,
      ...attendee
    }))

    const { data: attendeeRecords } = await (supabase
      .from('attendees') as any)
      .insert(attendeeData)
      .select()

    attendees = attendeeRecords || []
  }

  return { registration, attendees }
}

export async function getRegistrationById(registrationId: string): Promise<Registration | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  return data as Registration | null
}

export async function getRegistrationAttendees(registrationId: string): Promise<Attendee[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('attendees')
    .select('*')
    .eq('registration_id', registrationId)

  return (data as Attendee[]) || []
}

// Create multiple ticket types for an event
export async function createTicketTypes(
  eventId: string,
  ticketTypes: Array<{
    name: string
    description?: string
    price: number
    quantity_available?: number
    currency?: string
  }>
): Promise<TicketType[]> {
  const supabase = await createClient()

  const ticketsWithEventId = ticketTypes.map(ticket => ({
    event_id: eventId,
    name: ticket.name,
    description: ticket.description,
    price: ticket.price,
    currency: ticket.currency || 'PKR',
    quantity_available: ticket.quantity_available,
    quantity_sold: 0
  }))

  const { data } = await (supabase
    .from('ticket_types') as any)
    .insert(ticketsWithEventId)
    .select()

  return (data as TicketType[]) || []
}

// Check-in Scanner Functions

export interface AttendeeWithRegistration extends Attendee {
  registration: {
    id: string
    registration_number?: string
    ticket_type_id?: string
    status: Registration['status']
    payment_status: Registration['payment_status']
    registered_at: string
  }
  event: {
    id: string
    title: string
  }
}

export async function searchAttendees(
  eventId: string,
  query: string
): Promise<AttendeeWithRegistration[]> {
  const supabase = await createClient()

  // Search by name or email in attendees table
  const { data: attendees } = await (supabase
    .from('attendees') as any)
    .select('*, registrations(*, events(id, title))')
    .eq('registrations.event_id', eventId)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!attendees) return []

  return attendees.map((a: any) => ({
    ...a,
    registration: {
      id: a.registrations.id,
      registration_number: a.registrations.registration_number,
      ticket_type_id: a.registrations.ticket_type_id,
      status: a.registrations.status,
      payment_status: a.registrations.payment_status,
      registered_at: a.registrations.registered_at,
    },
    event: {
      id: a.registrations.events.id,
      title: a.registrations.events.title,
    },
  }))
}

export async function getAttendeeByRegistrationNumber(
  registrationNumber: string
): Promise<AttendeeWithRegistration | null> {
  const supabase = await createClient()

  const { data } = await (supabase
    .from('registrations') as any)
    .select('*, attendees(*), events(id, title)')
    .eq('registration_number', registrationNumber)
    .single()

  if (!data) return null

  const attendee = data.attendees?.[0]
  if (!attendee) return null

  return {
    ...attendee,
    registration: {
      id: data.id,
      registration_number: data.registration_number,
      ticket_type_id: data.ticket_type_id,
      status: data.status,
      payment_status: data.payment_status,
      registered_at: data.registered_at,
    },
    event: {
      id: data.events.id,
      title: data.events.title,
    },
  }
}

export async function getEventAttendees(eventId: string): Promise<AttendeeWithRegistration[]> {
  const supabase = await createClient()

  const { data: attendees } = await (supabase
    .from('attendees') as any)
    .select('*, registrations(*, events(id, title))')
    .eq('registrations.event_id', eventId)
    .order('created_at', { ascending: false })

  if (!attendees) return []

  return attendees.map((a: any) => ({
    ...a,
    registration: {
      id: a.registrations.id,
      registration_number: a.registrations.registration_number,
      ticket_type_id: a.registrations.ticket_type_id,
      status: a.registrations.status,
      payment_status: a.registrations.payment_status,
      registered_at: a.registrations.registered_at,
    },
    event: {
      id: a.registrations.events.id,
      title: a.registrations.events.title,
    },
  }))
}

export async function checkInAttendeeByRegistrationNumber(
  registrationNumber: string
): Promise<{ success: boolean; message: string; attendee?: AttendeeWithRegistration }> {
  const supabase = await createClient()

  // First get the registration
  const { data: registration, error: fetchError } = await (supabase
    .from('registrations') as any)
    .select('*, attendees(*), events(id, title)')
    .eq('registration_number', registrationNumber)
    .single()

  if (fetchError || !registration) {
    return { success: false, message: 'Registration not found' }
  }

  // Check if already checked in
  if (registration.checked_in_at) {
    const attendee = registration.attendees?.[0]
    return {
      success: false,
      message: `Already checked in at ${new Date(registration.checked_in_at).toLocaleTimeString()}`,
      attendee: attendee ? {
        ...attendee,
        registration: {
          id: registration.id,
          registration_number: registration.registration_number,
          ticket_type_id: registration.ticket_type_id,
          status: registration.status,
          payment_status: registration.payment_status,
          registered_at: registration.registered_at,
        },
        event: {
          id: registration.events.id,
          title: registration.events.title,
        },
      } : undefined,
    }
  }

  // Check payment status
  if (registration.payment_status !== 'paid') {
    return { success: false, message: `Payment not complete (Status: ${registration.payment_status})` }
  }

  // Update check-in status
  const { data: updatedReg, error: updateError } = await (supabase
    .from('registrations') as any)
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', registration.id)
    .select('*, attendees(*), events(id, title)')
    .single()

  if (updateError || !updatedReg) {
    return { success: false, message: 'Failed to check in attendee' }
  }

  // Send check-in confirmation email asynchronously
  // Don't await to avoid blocking the response
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/emails/send-checkin-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId: updatedReg.id }),
  }).catch((err) => logger.error('Failed to send check-in email:', err))

  const attendee = updatedReg.attendees?.[0]
  return {
    success: true,
    message: 'Successfully checked in!',
    attendee: attendee ? {
      ...attendee,
      registration: {
        id: updatedReg.id,
        registration_number: updatedReg.registration_number,
        ticket_type_id: updatedReg.ticket_type_id,
        status: updatedReg.status,
        payment_status: updatedReg.payment_status,
        registered_at: updatedReg.registered_at,
      },
      event: {
        id: updatedReg.events.id,
        title: updatedReg.events.title,
      },
    } : undefined,
  }
}

export async function getEventCheckInStats(eventId: string): Promise<{
  total: number
  checkedIn: number
  pending: number
}> {
  const supabase = await createClient()

  // Get total registrations
  const { count: total } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended'])

  // Get checked in count
  const { count: checkedIn } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('checked_in_at', 'is', null)

  return {
    total: total || 0,
    checkedIn: checkedIn || 0,
    pending: (total || 0) - (checkedIn || 0),
  }
}
