import { createClient } from '@/lib/auth/config'

// Types for advanced ticketing features
export interface WaitlistEntry {
  id: string
  event_id: string
  ticket_type_id: string
  user_id: string
  quantity: number
  position: number
  status: 'waiting' | 'notified' | 'expired' | 'converted'
  notified_at?: string
  expires_at?: string
  created_at: string
}

export interface PricingRule {
  id: string
  event_id: string
  ticket_type_id?: string
  rule_type: 'early_bird' | 'group_discount' | 'demand_based' | 'inventory_based' | 'time_based'
  name: string
  priority: number
  conditions: any
  actions: any
  is_active: boolean
  valid_from: string
  valid_until: string
  created_at: string
}

export interface TicketBundle {
  id: string
  event_id: string
  name: string
  description: string
  bundle_type: 'fixed' | 'flexible'
  ticket_types: string[]
  discount_percentage: number
  max_quantity: number
  min_quantity: number
  is_active: boolean
  valid_until?: string
  created_at: string
}

export interface GroupBooking {
  id: string
  event_id: string
  group_leader_id: string
  name: string
  email: string
  phone: string
  total_tickets: number
  total_amount: number
  deposit_amount: number
  deposit_paid: boolean
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_deadline: string
  created_at: string
}

export interface GroupBookingAttendee {
  id: string
  group_booking_id: string
  name: string
  email: string
  phone: string
  ticket_type_id: string
  status: 'pending' | 'confirmed'
}

export interface SeasonPass {
  id: string
  user_id: string
  pass_type: 'all_events' | 'category' | 'venue'
  category_id?: string
  venue_id?: string
  valid_from: string
  valid_until: string
  max_events?: number
  events_attended: number
  status: 'active' | 'expired' | 'suspended'
  purchase_date: string
  amount_paid: number
}

export interface TicketResale {
  id: string
  registration_id: string
  seller_id: string
  buyer_id?: string
  listing_price: number
  status: 'listed' | 'sold' | 'cancelled' | 'expired'
  listed_at: string
  sold_at?: string
  platform_fee: number
  seller_payout: number
}

// Waitlist
export async function getWaitlistPosition(data: {
  event_id: string
  ticket_type_id: string
  user_id: string
}): Promise<WaitlistEntry | null> {
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from('waitlist')
    .select('*')
    .eq('event_id', data.event_id)
    .eq('ticket_type_id', data.ticket_type_id)
    .eq('user_id', data.user_id)
    .single()

  return entry as WaitlistEntry | null
}

export async function joinWaitlist(data: {
  event_id: string
  ticket_type_id: string
  user_id: string
  quantity: number
}): Promise<WaitlistEntry | null> {
  const supabase = await createClient()

  // Get the current highest position
  const { data: lastEntry } = await (supabase
    .from('waitlist') as any)
    .select('position')
    .eq('event_id', data.event_id)
    .eq('ticket_type_id', data.ticket_type_id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (lastEntry?.position || 0) + 1

  const { data: entry } = await (supabase
    .from('waitlist') as any)
    .insert({
      event_id: data.event_id,
      ticket_type_id: data.ticket_type_id,
      user_id: data.user_id,
      quantity: data.quantity,
      position: nextPosition,
      status: 'waiting',
    })
    .select()
    .single()

  return entry as WaitlistEntry | null
}

export async function getWaitlistEntries(params: {
  event_id: string
  ticket_type_id?: string
  status?: string
  limit?: number
}): Promise<WaitlistEntry[]> {
  const supabase = await createClient()

  let query = supabase
    .from('waitlist')
    .select('*')
    .eq('event_id', params.event_id)
    .order('position', { ascending: true })

  if (params.ticket_type_id) {
    query = query.eq('ticket_type_id', params.ticket_type_id)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data } = await query
  return (data as WaitlistEntry[]) || []
}

export async function notifyWaitlist(waitlistId: string): Promise<boolean> {
  const supabase = await createClient()

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { error } = await (supabase
    .from('waitlist') as any)
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', waitlistId)

  return !error
}

export async function convertWaitlist(waitlistId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('waitlist') as any)
    .update({ status: 'converted' })
    .eq('id', waitlistId)

  if (!error) {
    await supabase.rpc('update_waitlist_positions', {
      p_event_id: '',
      p_ticket_type_id: '',
    } as any)
  }

  return !error
}

export async function leaveWaitlist(waitlistId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('waitlist') as any)
    .delete()
    .eq('id', waitlistId)

  return !error
}

// Dynamic Pricing
export async function getPricingRules(params: {
  event_id: string
  ticket_type_id?: string
  is_active?: boolean
}): Promise<PricingRule[]> {
  const supabase = await createClient()

  let query = supabase
    .from('pricing_rules')
    .select('*')
    .eq('event_id', params.event_id)
    .order('priority', { ascending: true })

  if (params.ticket_type_id) {
    query = query.or(`ticket_type_id.eq.${params.ticket_type_id},ticket_type_id.is.null`)
  }

  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active)
  }

  const { data } = await query
  return (data as PricingRule[]) || []
}

export async function createPricingRule(data: {
  event_id: string
  ticket_type_id?: string
  rule_type: 'early_bird' | 'group_discount' | 'demand_based' | 'inventory_based' | 'time_based'
  name: string
  priority: number
  conditions: any
  actions: any
  valid_from: string
  valid_until: string
}): Promise<PricingRule | null> {
  const supabase = await createClient()

  const { data: rule } = await (supabase
    .from('pricing_rules') as any)
    .insert({
      event_id: data.event_id,
      ticket_type_id: data.ticket_type_id,
      rule_type: data.rule_type,
      name: data.name,
      priority: data.priority,
      conditions: data.conditions,
      actions: data.actions,
      is_active: true,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
    })
    .select()
    .single()

  return rule as PricingRule | null
}

export async function calculateDynamicPrice(data: {
  event_id: string
  ticket_type_id: string
  quantity: number
}): Promise<{ base_price: number; final_price: number; discount: number; applied_rules: string[] }> {
  const supabase = await createClient()

  const { data: result } = await supabase.rpc('calculate_dynamic_price', {
    p_event_id: data.event_id,
    p_ticket_type_id: data.ticket_type_id,
    p_quantity: data.quantity,
  } as any)

  return (result as any) || { base_price: 0, final_price: 0, discount: 0, applied_rules: [] }
}

export async function updatePricingRule(
  ruleId: string,
  updates: Partial<PricingRule>
): Promise<PricingRule | null> {
  const supabase = await createClient()

  const { data: rule } = await (supabase
    .from('pricing_rules') as any)
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single()

  return rule as PricingRule | null
}

export async function deletePricingRule(ruleId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('pricing_rules') as any)
    .delete()
    .eq('id', ruleId)

  return !error
}

// Ticket Bundles
export async function getTicketBundles(eventId: string): Promise<TicketBundle[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ticket_bundles')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (data as TicketBundle[]) || []
}

export async function createTicketBundle(data: {
  event_id: string
  name: string
  description: string
  bundle_type: 'fixed' | 'flexible'
  ticket_types: string[]
  discount_percentage: number
  max_quantity: number
  min_quantity: number
  valid_until?: string
}): Promise<TicketBundle | null> {
  const supabase = await createClient()

  const { data: bundle } = await (supabase
    .from('ticket_bundles') as any)
    .insert({
      event_id: data.event_id,
      name: data.name,
      description: data.description,
      bundle_type: data.bundle_type,
      ticket_types: data.ticket_types,
      discount_percentage: data.discount_percentage,
      max_quantity: data.max_quantity,
      min_quantity: data.min_quantity,
      is_active: true,
      valid_until: data.valid_until,
    })
    .select()
    .single()

  return bundle as TicketBundle | null
}

export async function calculateBundlePrice(
  bundleId: string,
  quantity: number
): Promise<{ original_price: number; discountedPrice: number; savings: number }> {
  const supabase = await createClient()

  const { data: bundle } = await (supabase
    .from('ticket_bundles') as any)
    .select('*')
    .eq('id', bundleId)
    .single()

  if (!bundle) {
    return { original_price: 0, discountedPrice: 0, savings: 0 }
  }

  // Get ticket prices
  const { data: ticketTypes } = await (supabase
    .from('ticket_types') as any)
    .select('price')
    .in('id', bundle.ticket_types)

  const avgPrice =
    ticketTypes && ticketTypes.length > 0
      ? ticketTypes.reduce((sum: number, tt: any) => sum + (tt.price || 0), 0) / ticketTypes.length
      : 0

  const originalPrice = avgPrice * quantity
  const discountedPrice = originalPrice * (1 - bundle.discount_percentage / 100)
  const savings = originalPrice - discountedPrice

  return {
    original_price: Math.round(originalPrice),
    discountedPrice: Math.round(discountedPrice),
    savings: Math.round(savings),
  }
}

// Group Bookings
export async function createGroupBooking(data: {
  event_id: string
  group_leader_id: string
  name: string
  email: string
  phone: string
  total_tickets: number
  total_amount: number
  deposit_amount: number
  payment_deadline: string
}): Promise<GroupBooking | null> {
  const supabase = await createClient()

  const { data: booking } = await (supabase
    .from('group_bookings') as any)
    .insert({
      event_id: data.event_id,
      group_leader_id: data.group_leader_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      total_tickets: data.total_tickets,
      total_amount: data.total_amount,
      deposit_amount: data.deposit_amount,
      deposit_paid: false,
      status: 'pending',
      payment_deadline: data.payment_deadline,
    })
    .select()
    .single()

  return booking as GroupBooking | null
}

export async function getGroupBooking(bookingId: string): Promise<GroupBooking | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('group_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  return data as GroupBooking | null
}

export async function getGroupBookingsByEvent(eventId: string): Promise<GroupBooking[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('group_bookings')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  return (data as GroupBooking[]) || []
}

export async function addGroupAttendee(data: {
  group_booking_id: string
  name: string
  email: string
  phone: string
  ticket_type_id: string
}): Promise<GroupBookingAttendee | null> {
  const supabase = await createClient()

  const { data: attendee } = await (supabase
    .from('group_booking_attendees') as any)
    .insert({
      group_booking_id: data.group_booking_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      ticket_type_id: data.ticket_type_id,
      status: 'pending',
    })
    .select()
    .single()

  return attendee as GroupBookingAttendee | null
}

export async function getGroupAttendees(bookingId: string): Promise<GroupBookingAttendee[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('group_booking_attendees')
    .select('*')
    .eq('group_booking_id', bookingId)

  return (data as GroupBookingAttendee[]) || []
}

// Season Passes
export async function createSeasonPass(data: {
  user_id: string
  pass_type: 'all_events' | 'category' | 'venue'
  category_id?: string
  venue_id?: string
  valid_from: string
  valid_until: string
  max_events?: number
  amount_paid: number
}): Promise<SeasonPass | null> {
  const supabase = await createClient()

  const { data: pass } = await (supabase
    .from('season_passes') as any)
    .insert({
      user_id: data.user_id,
      pass_type: data.pass_type,
      category_id: data.category_id,
      venue_id: data.venue_id,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      max_events: data.max_events,
      events_attended: 0,
      status: 'active',
      purchase_date: new Date().toISOString(),
      amount_paid: data.amount_paid,
    })
    .select()
    .single()

  return pass as SeasonPass | null
}

export async function getUserSeasonPasses(userId: string): Promise<SeasonPass[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('season_passes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (data as SeasonPass[]) || []
}

export async function validateSeasonPass(
  passId: string,
  eventId: string
): Promise<{ valid: boolean; reason?: string }> {
  const supabase = await createClient()

  const { data: pass } = await (supabase
    .from('season_passes') as any)
    .select('*')
    .eq('id', passId)
    .single()

  if (!pass) {
    return { valid: false, reason: 'Pass not found' }
  }

  if (pass.status !== 'active') {
    return { valid: false, reason: 'Pass is not active' }
  }

  const now = new Date()
  if (new Date(pass.valid_from) > now) {
    return { valid: false, reason: 'Pass not yet valid' }
  }

  if (new Date(pass.valid_until) < now) {
    return { valid: false, reason: 'Pass has expired' }
  }

  if (pass.max_events && pass.events_attended >= pass.max_events) {
    return { valid: false, reason: 'Maximum events reached' }
  }

  // Check if event matches pass criteria
  if (pass.pass_type === 'category') {
    const { data: event } = await (supabase
      .from('events') as any)
      .select('category_id')
      .eq('id', eventId)
      .single()

    if (event?.category_id !== pass.category_id) {
      return { valid: false, reason: 'Event category mismatch' }
    }
  }

  if (pass.pass_type === 'venue') {
    const { data: event } = await (supabase
      .from('events') as any)
      .select('venue_id')
      .eq('id', eventId)
      .single()

    if (event?.venue_id !== pass.venue_id) {
      return { valid: false, reason: 'Event venue mismatch' }
    }
  }

  return { valid: true }
}

export async function incrementSeasonPassUsage(passId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('increment_pass_usage', {
    pass_id: passId,
  } as any)

  return !error
}

// Ticket Resale
export async function listTicketForResale(data: {
  registration_id: string
  seller_id: string
  listing_price: number
}): Promise<TicketResale | null> {
  const supabase = await createClient()

  const platformFee = data.listing_price * 0.05 // 5% platform fee
  const sellerPayout = data.listing_price - platformFee

  const { data: resale } = await (supabase
    .from('ticket_resale') as any)
    .insert({
      registration_id: data.registration_id,
      seller_id: data.seller_id,
      listing_price: data.listing_price,
      status: 'listed',
      listed_at: new Date().toISOString(),
      platform_fee: platformFee,
      seller_payout: sellerPayout,
    })
    .select()
    .single()

  return resale as TicketResale | null
}

export async function getResaleListings(params: {
  event_id?: string
  status?: string
  limit?: number
}): Promise<TicketResale[]> {
  const supabase = await createClient()

  let query = supabase
    .from('ticket_resale')
    .select('*, registrations(event_id)')
    .order('listed_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  } else {
    query = query.eq('status', 'listed')
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data } = await query

  // Filter by event_id if provided
  let filteredData = data as TicketResale[]
  if (params.event_id) {
    filteredData = filteredData.filter((r: any) => r.registrations?.event_id === params.event_id)
  }

  return filteredData
}

export async function purchaseResaleTicket(
  resaleId: string,
  buyerId: string
): Promise<TicketResale | null> {
  const supabase = await createClient()

  const { data: resale } = await (supabase
    .from('ticket_resale') as any)
    .update({
      buyer_id: buyerId,
      status: 'sold',
      sold_at: new Date().toISOString(),
    })
    .eq('id', resaleId)
    .select()
    .single()

  return resale as TicketResale | null
}

export async function cancelResaleListing(resaleId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('ticket_resale') as any)
    .update({ status: 'cancelled' })
    .eq('id', resaleId)

  return !error
}
