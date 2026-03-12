'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import * as ticketingQueries from '@/lib/database/queries/ticketing'

/**
 * Join waitlist for a sold-out event
 */
export async function joinWaitlist(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to join the waitlist' }
  }

  const eventId = formData.get('event_id') as string
  const ticketTypeId = formData.get('ticket_type_id') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1

  if (!eventId || !ticketTypeId) {
    return { error: 'Event ID and ticket type are required' }
  }

  // Check if already on waitlist
  const existing = await ticketingQueries.getWaitlistPosition({
    event_id: eventId,
    ticket_type_id: ticketTypeId,
    user_id: user.id,
  })

  if (existing) {
    return { error: 'You are already on the waitlist', position: existing.position }
  }

  const entry = await ticketingQueries.joinWaitlist({
    event_id: eventId,
    ticket_type_id: ticketTypeId,
    user_id: user.id,
    quantity,
  })

  if (!entry) {
    return { error: 'Failed to join waitlist' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, waitlist: entry }
}

/**
 * Leave waitlist
 */
export async function leaveWaitlist(waitlistId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await ticketingQueries.leaveWaitlist(waitlistId)

  if (!success) {
    return { error: 'Failed to leave waitlist' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

/**
 * Create pricing rule (organizer only)
 */
export async function createPricingRule(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is organizer
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'organizer') {
    return { error: 'Only organizers can create pricing rules' }
  }

  const eventId = formData.get('event_id') as string
  const ruleType = formData.get('rule_type') as any
  const name = formData.get('name') as string
  const priority = parseInt(formData.get('priority') as string) || 0
  const conditions = JSON.parse(formData.get('conditions') as string || '{}')
  const actions = JSON.parse(formData.get('actions') as string || '{}')
  const validFrom = formData.get('valid_from') as string
  const validUntil = formData.get('valid_until') as string

  if (!eventId || !ruleType || !name) {
    return { error: 'Event ID, rule type, and name are required' }
  }

  const rule = await ticketingQueries.createPricingRule({
    event_id: eventId,
    ticket_type_id: formData.get('ticket_type_id') as string || undefined,
    rule_type: ruleType,
    name,
    priority,
    conditions,
    actions,
    valid_from: validFrom,
    valid_until: validUntil,
  })

  if (!rule) {
    return { error: 'Failed to create pricing rule' }
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true, rule }
}

/**
 * Calculate dynamic price
 */
export async function calculateDynamicPrice(eventId: string, ticketTypeId: string, quantity: number) {
  if (!eventId || !ticketTypeId || quantity < 1) {
    return { error: 'Invalid parameters' }
  }

  const result = await ticketingQueries.calculateDynamicPrice({
    event_id: eventId,
    ticket_type_id: ticketTypeId,
    quantity,
  })

  return { success: true, pricing: result }
}

/**
 * Update pricing rule
 */
export async function updatePricingRule(ruleId: string, updates: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const rule = await ticketingQueries.updatePricingRule(ruleId, updates)

  if (!rule) {
    return { error: 'Failed to update pricing rule' }
  }

  revalidatePath(`/events/${rule.event_id}/manage`)
  return { success: true, rule }
}

/**
 * Delete pricing rule
 */
export async function deletePricingRule(ruleId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await ticketingQueries.deletePricingRule(ruleId)

  if (!success) {
    return { error: 'Failed to delete pricing rule' }
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true }
}

/**
 * Create ticket bundle (organizer only)
 */
export async function createTicketBundle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is organizer
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'organizer') {
    return { error: 'Only organizers can create ticket bundles' }
  }

  const eventId = formData.get('event_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const bundleType = formData.get('bundle_type') as 'fixed' | 'flexible'
  const ticketTypes = JSON.parse(formData.get('ticket_types') as string || '[]')
  const discountPercentage = parseFloat(formData.get('discount_percentage') as string)
  const maxQuantity = parseInt(formData.get('max_quantity') as string)
  const minQuantity = parseInt(formData.get('min_quantity') as string)
  const validUntil = formData.get('valid_until') as string

  if (!eventId || !name || !ticketTypes.length) {
    return { error: 'Event ID, name, and ticket types are required' }
  }

  const bundle = await ticketingQueries.createTicketBundle({
    event_id: eventId,
    name,
    description,
    bundle_type: bundleType,
    ticket_types: ticketTypes,
    discount_percentage: discountPercentage,
    max_quantity: maxQuantity,
    min_quantity: minQuantity,
    valid_until: validUntil || undefined,
  })

  if (!bundle) {
    return { error: 'Failed to create ticket bundle' }
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { success: true, bundle }
}

/**
 * Calculate bundle price
 */
export async function getBundlePrice(bundleId: string, quantity: number) {
  const result = await ticketingQueries.calculateBundlePrice(bundleId, quantity)

  return { success: true, pricing: result }
}

/**
 * Create group booking
 */
export async function createGroupBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const eventId = formData.get('event_id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const totalTickets = parseInt(formData.get('total_tickets') as string)
  const totalAmount = parseFloat(formData.get('total_amount') as string)
  const depositAmount = parseFloat(formData.get('deposit_amount') as string)
  const paymentDeadline = formData.get('payment_deadline') as string

  if (!eventId || !name || !email || !totalTickets) {
    return { error: 'Event ID, name, email, and ticket count are required' }
  }

  const booking = await ticketingQueries.createGroupBooking({
    event_id: eventId,
    group_leader_id: user.id,
    name,
    email,
    phone,
    total_tickets: totalTickets,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    payment_deadline: paymentDeadline,
  })

  if (!booking) {
    return { error: 'Failed to create group booking' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, booking }
}

/**
 * Add attendee to group booking
 */
export async function addGroupAttendee(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const groupBookingId = formData.get('group_booking_id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const ticketTypeId = formData.get('ticket_type_id') as string

  if (!groupBookingId || !name || !email || !ticketTypeId) {
    return { error: 'All fields are required' }
  }

  const attendee = await ticketingQueries.addGroupAttendee({
    group_booking_id: groupBookingId,
    name,
    email,
    phone,
    ticket_type_id: ticketTypeId,
  })

  if (!attendee) {
    return { error: 'Failed to add attendee' }
  }

  revalidatePath(`/group-bookings/${groupBookingId}`)
  return { success: true, attendee }
}

/**
 * Create season pass
 */
export async function createSeasonPass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const passType = formData.get('pass_type') as 'all_events' | 'category' | 'venue'
  const categoryId = formData.get('category_id') as string
  const venueId = formData.get('venue_id') as string
  const validFrom = formData.get('valid_from') as string
  const validUntil = formData.get('valid_until') as string
  const maxEvents = parseInt(formData.get('max_events') as string)
  const amountPaid = parseFloat(formData.get('amount_paid') as string)

  if (!passType || !validFrom || !validUntil) {
    return { error: 'Pass type, valid from, and valid until are required' }
  }

  const pass = await ticketingQueries.createSeasonPass({
    user_id: user.id,
    pass_type: passType,
    category_id: categoryId || undefined,
    venue_id: venueId || undefined,
    valid_from: validFrom,
    valid_until: validUntil,
    max_events: maxEvents || undefined,
    amount_paid: amountPaid,
  })

  if (!pass) {
    return { error: 'Failed to create season pass' }
  }

  revalidatePath('/profile/season-passes')
  return { success: true, pass }
}

/**
 * Validate season pass for event
 */
export async function validateSeasonPass(passId: string, eventId: string) {
  const result = await ticketingQueries.validateSeasonPass(passId, eventId)

  return { success: true, validation: result }
}

/**
 * List ticket for resale
 */
export async function listTicketForResale(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const registrationId = formData.get('registration_id') as string
  const listingPrice = parseFloat(formData.get('listing_price') as string)

  if (!registrationId || !listingPrice) {
    return { error: 'Registration ID and listing price are required' }
  }

  // Verify ownership
  const { data: registration } = await supabase
    .from('registrations')
    .select('user_id')
    .eq('id', registrationId)
    .single() as any

  if (!registration || registration.user_id !== user.id) {
    return { error: 'You do not own this ticket' }
  }

  const resale = await ticketingQueries.listTicketForResale({
    registration_id: registrationId,
    seller_id: user.id,
    listing_price: listingPrice,
  })

  if (!resale) {
    return { error: 'Failed to list ticket for resale' }
  }

  revalidatePath('/profile/my-tickets')
  return { success: true, resale }
}

/**
 * Purchase resale ticket
 */
export async function purchaseResaleTicket(resaleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const resale = await ticketingQueries.purchaseResaleTicket(resaleId, user.id)

  if (!resale) {
    return { error: 'Failed to purchase ticket' }
  }

  revalidatePath('/marketplace/resale')
  return { success: true, resale }
}

/**
 * Cancel resale listing
 */
export async function cancelResaleListing(resaleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await ticketingQueries.cancelResaleListing(resaleId)

  if (!success) {
    return { error: 'Failed to cancel listing' }
  }

  revalidatePath('/profile/my-tickets')
  return { success: true }
}
