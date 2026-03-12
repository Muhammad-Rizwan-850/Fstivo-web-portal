'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PaymentMethod } from '@/lib/types'
import { createEventRegistration } from '@/lib/database/queries/registrations'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RegistrationFormData {
  event_id: string
  ticket_type_id: string
  quantity: number
  attendees: Array<{
    full_name: string
    email: string
    phone?: string
    dietary_requirements?: string
  }>
  payment_method: PaymentMethod
  total_amount: number
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const attendeeSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dietary_requirements: z.string().optional(),
})

const registrationSchema = z.object({
  event_id: z.string().min(1, 'Event ID is required'),
  ticket_type_id: z.string().min(1, 'Ticket type is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per registration'),
  attendees: z.array(attendeeSchema).min(1, 'At least one attendee is required'),
  payment_method: z.enum(['stripe', 'jazzcash', 'easypaisa', 'bank_transfer']),
  total_amount: z.number().min(0, 'Total amount must be 0 or greater'),
})

// ============================================================================
// REGISTRATION ACTIONS
// ============================================================================

/**
 * Create event registration with attendees
 */
export async function createEventRegistrationAction(formData: RegistrationFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to register for an event' }
  }

  // Validate form data
  const validatedFields = registrationSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  // Verify number of attendees matches quantity
  if (data.attendees.length !== data.quantity) {
    return { error: 'Number of attendees must match ticket quantity' }
  }

  try {
    // Check if event exists and is published
    const { data: event, error: eventError } = await (supabase.from('events') as any)
      .select('id, title, is_published, status, capacity, start_date')
      .eq('id', data.event_id)
      .single()

    if (eventError || !event) {
      return { error: 'Event not found' }
    }

    if (!event.is_published || event.status !== 'published') {
      return { error: 'This event is not available for registration' }
    }

    // Check if event has passed
    if (new Date(event.start_date) < new Date()) {
      return { error: 'This event has already ended' }
    }

    // Check ticket availability
    const { data: ticketType } = await (supabase.from('ticket_types') as any)
      .select('id, quantity_available, quantity_sold, price')
      .eq('id', data.ticket_type_id)
      .eq('event_id', data.event_id)
      .single()

    if (!ticketType) {
      return { error: 'Ticket type not found' }
    }

    const availableTickets = (ticketType.quantity_available || 0) - (ticketType.quantity_sold || 0)
    if (availableTickets < data.quantity) {
      return { error: `Not enough tickets available. Only ${availableTickets} tickets left.` }
    }

    // Check event capacity
    if (event.capacity) {
      const { count: registeredCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', data.event_id)
        .in('status', ['pending', 'confirmed', 'attended'])

      if (registeredCount && registeredCount + data.quantity > event.capacity) {
        return { error: 'Event capacity reached' }
      }
    }

    // Check if user already registered for this event
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', data.event_id)
      .eq('user_id', user.id)
      .single()

    if (existingReg) {
      return { error: 'You are already registered for this event' }
    }

    // Generate unique registration number
    const registrationNumber = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create registration
    const result = await createEventRegistration(user.id, {
      event_id: data.event_id,
      ticket_type_id: data.ticket_type_id,
      quantity: data.quantity,
      total_amount: data.total_amount,
      payment_method: data.payment_method,
      attendees: data.attendees,
    })

    if (!result) {
      return { error: 'Failed to create registration' }
    }

    // Update registration with registration number
    const { data: updatedReg, error: updateError } = await (supabase.from('registrations') as any)
      .update({ registration_number: registrationNumber })
      .eq('id', result.registration.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update registration number:', updateError)
    }

    // Revalidate paths
    revalidatePath('/dashboard/registrations', 'page')
    revalidatePath(`/events/${data.event_id}`, 'page')

    // Send registration confirmation email asynchronously
    // Don't await to avoid blocking the response
    if (updatedReg?.id) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/emails/send-registration-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: updatedReg.id }),
      }).catch((err) => logger.error('Failed to send registration email:', err))
    }

    return {
      success: true,
      registration: updatedReg || result.registration,
      attendees: result.attendees,
      message: 'Registration successful! Please complete your payment.',
    }
  } catch (error: any) {
    logger.error('Registration error:', error)
    return { error: error.message || 'Failed to create registration' }
  }
}

/**
 * Get user's registrations
 */
export async function getUserRegistrationsAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const { data: registrations, error } = await (supabase
    .from('registrations') as any)
    .select(`
      *,
      events(id, title, start_date, venue_city, cover_image_url),
      ticket_types(id, name, price),
      attendees(*)
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch registrations:', error)
    return { error: error.message }
  }

  return { registrations: registrations || [] }
}

/**
 * Get registration details by ID
 */
export async function getRegistrationByIdAction(registrationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const { data: registration, error } = await (supabase
    .from('registrations') as any)
    .select(`
      *,
      events(*),
      ticket_types(*),
      attendees(*)
    `)
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    logger.error('Failed to fetch registration:', error)
    return { error: error.message }
  }

  if (!registration) {
    return { error: 'Registration not found' }
  }

  return { registration }
}

/**
 * Cancel registration
 */
export async function cancelRegistrationAction(registrationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if registration belongs to user
  const { data: existingReg } = await (supabase.from('registrations') as any)
    .select('user_id, event_id, ticket_type_id, quantity, status, registered_at')
    .eq('id', registrationId)
    .single()

  if (!existingReg) {
    return { error: 'Registration not found' }
  }

  if (existingReg.user_id !== user.id) {
    return { error: 'You do not have permission to cancel this registration' }
  }

  // Check if registration can be cancelled (e.g., not too close to event)
  const { data: event } = await (supabase.from('events') as any)
    .select('start_date')
    .eq('id', existingReg.event_id)
    .single()

  if (event) {
    const eventDate = new Date(event.start_date)
    const now = new Date()
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilEvent < 24) {
      return { error: 'Cannot cancel registration within 24 hours of the event' }
    }
  }

  // Update ticket sold count
  if (existingReg.ticket_type_id) {
    try {
      await (supabase.rpc as any)('decrement_ticket_sold', {
        ticket_id: existingReg.ticket_type_id,
        quantity: existingReg.quantity || 1
      })
    } catch {
      logger.info('RPC decrement_ticket_sold not available')
    }
  }

  // Delete registration (soft delete by updating status)
  const { error } = await (supabase.from('registrations') as any)
    .update({ status: 'cancelled' })
    .eq('id', registrationId)

  if (error) {
    logger.error('Failed to cancel registration:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/registrations', 'page')

  return { success: true, message: 'Registration cancelled successfully' }
}

/**
 * Get event tickets with availability
 */
export async function getEventTicketsAction(eventId: string) {
  const supabase = await createClient()

  const { data: tickets, error } = await (supabase
    .from('ticket_types') as any)
    .select('id, name, description, price, currency, quantity_available, quantity_sold')
    .eq('event_id', eventId)
    .order('price', { ascending: true })

  if (error) {
    logger.error('Failed to fetch tickets:', error)
    return { error: error.message }
  }

  // Calculate availability
  const ticketsWithAvailability = (tickets || []).map((ticket: any) => ({
    ...ticket,
    available: (ticket.quantity_available || 0) - (ticket.quantity_sold || 0),
  }))

  return { tickets: ticketsWithAvailability }
}
