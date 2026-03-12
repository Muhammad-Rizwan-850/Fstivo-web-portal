import { createClient } from '@/lib/auth/config'
import type { Event, EventCategory } from '@/lib/types'
import { logger } from '@/lib/logger';

// Extended Event type for API responses with relations
export interface EventWithRelations extends Omit<Event, 'category' | 'ticket_types' | '_count'> {
  category: EventCategory | null
  ticket_types: Array<{ id: string; price: number; name: string; currency: string }> | null
  registrations_count?: number
}

export async function getPublicEvents(filters?: {
  type?: string
  location?: string
  date?: string
  category?: string
  mode?: string
  search?: string
  page?: number
  perPage?: number
  sortBy?: 'date' | 'price' | 'popularity'
}): Promise<{ events: Event[]; count: number }> {
  const supabase = await createClient()
  const page = filters?.page || 1
  const perPage = filters?.perPage || 6
  const start = (page - 1) * perPage
  const end = start + perPage - 1
  const sortBy = filters?.sortBy || 'date'

  let query = supabase
    .from('events')
    .select('*, category:event_categories(*), ticket_types(*), registrations(count)', { count: 'exact' })
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString())

  // Apply sorting based on sortBy parameter
  if (sortBy === 'date') {
    query = query.order('start_date', { ascending: true })
  } else if (sortBy === 'price') {
    query = query.order('price', { ascending: true })
  } else if (sortBy === 'popularity') {
    // For popularity, we'll sort by registrations count (requires a different approach)
    // For now, sort by start_date as fallback
    query = query.order('start_date', { ascending: true })
  }

  if (filters?.type) {
    query = query.eq('event_type', filters.type)
  }

  if (filters?.location) {
    query = query.eq('venue_city', filters.location)
  }

  if (filters?.category) {
    query = query.eq('category_id', filters.category)
  }

  if (filters?.mode) {
    query = query.eq('event_mode', filters.mode)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  if (filters?.date) {
    const targetDate = new Date(filters.date)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    query = query.gte('start_date', targetDate.toISOString()).lt('start_date', nextDay.toISOString())
  }

  const { data, error, count } = await query.range(start, end)

  if (error) {
    logger.error('Error fetching events:', error)
    return { events: [], count: 0 }
  }

  // Transform the data to match the Event interface
  let events = (data as EventWithRelations[]).map(event => ({
    ...event,
    category: event.category || undefined,
    ticket_types: event.ticket_types || undefined,
    _count: event.registrations_count ? { registrations: event.registrations_count } : undefined,
  })) as Event[]

  // If sorting by popularity, sort in memory after fetching
  if (sortBy === 'popularity') {
    events = events.sort((a, b) => {
      const aCount = a._count?.registrations || 0
      const bCount = b._count?.registrations || 0
      return bCount - aCount // Descending order
    })
  }

  return { events, count: count || 0 }
}

// Get all event categories
export async function getEventCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_categories')
    .select('*')
    .order('name', { ascending: true })

  return (data as EventCategory[]) || []
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  return data as Event | null
}

export async function getUserEvents(userId: string): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', userId)
    .order('created_at', { ascending: false })

  return (data as Event[]) || []
}

export async function createEvent(event: Partial<Event>): Promise<Event | null> {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('events') as any)
    .insert(event)
    .select()
    .single()

  return data as Event | null
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('events') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single()

  return data as Event | null
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await (supabase
    .from('events') as any)
    .delete()
    .eq('id', eventId)

  return !error
}

// Event Statistics Types
export interface TicketSalesByType {
  type: string
  sold: number
  revenue: number
}

export interface RegistrationsByDay {
  date: string
  count: number
}

export interface EventStats {
  total_registrations: number
  total_revenue: number
  total_checked_in: number
  capacity: number
  tickets_sold_by_type: TicketSalesByType[]
  registrations_by_day: RegistrationsByDay[]
}

export async function getEventStats(eventId: string): Promise<EventStats | null> {
  const supabase = await createClient()

  // Try using the RPC function first
  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
    'get_event_stats',
    { event_id: eventId }
  )

  if (!rpcError && rpcData) {
    return rpcData as EventStats
  }

  // Fallback: Manually fetch stats if RPC function doesn't exist
  logger.warn('RPC function get_event_stats not available, using fallback query')

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return null

  // Get registrations count
  const { count: total_registrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'attended'])

  // Get total revenue - properly typed query
  const { data: payments } = await (supabase
    .from('payments')
    .select('amount') as any)
    .eq('registration_id', eventId)
    .eq('status', 'completed')

  const total_revenue = payments?.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0) || 0

  // Get checked in count
  const { count: total_checked_in } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('checked_in_at', 'is', null)

  // Get registrations by day (last 10 days) - properly typed
  const { data: dailyRegs } = await (supabase
    .from('registrations')
    .select('registered_at') as any)
    .eq('event_id', eventId)
    .gte('registered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('registered_at', { ascending: false })
    .limit(100)

  // Group by date
  const regsByDate = new Map<string, number>()
  dailyRegs?.forEach((reg: { registered_at: string }) => {
    const date = new Date(reg.registered_at).toISOString().split('T')[0]
    regsByDate.set(date, (regsByDate.get(date) || 0) + 1)
  })

  const registrations_by_day: RegistrationsByDay[] = Array.from(regsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .slice(0, 10)
    .reverse()

  // Get ticket types with sales - properly typed
  const { data: ticketTypes } = await (supabase
    .from('ticket_types')
    .select('id, name, price') as any)
    .eq('event_id', eventId)

  let tickets_sold_by_type: TicketSalesByType[] = []

  if (ticketTypes && ticketTypes.length > 0) {
    // Count registrations per ticket type
    for (const tt of ticketTypes) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('ticket_type_id', tt.id)

      tickets_sold_by_type.push({
        type: tt.name,
        sold: count || 0,
        revenue: ((count || 0) * tt.price)
      })
    }
  } else {
    // Fallback to general pricing
    tickets_sold_by_type = [{
      type: 'General',
      sold: total_registrations || 0,
      revenue: total_revenue
    }]
  }

  return {
    total_registrations: total_registrations || 0,
    total_revenue,
    total_checked_in: total_checked_in || 0,
    capacity: (event as any).capacity || 0,
    tickets_sold_by_type,
    registrations_by_day
  }
}

// Analytics Functions

export interface RevenueData {
  month: string
  current: number
  previous: number
  target: number
}

export interface RegistrationTrendData {
  date: string
  registrations: number
  checkIns: number
  target: number
}

export interface EventTypeDistribution {
  name: string
  value: number
  count: number
}

export interface PlatformStats {
  totalRevenue: number
  totalEvents: number
  totalAttendees: number
  avgCheckInRate: number
}

export async function getPlatformAnalytics(
  dateRange: '7days' | '30days' | '90days' | '12months' = '30days'
): Promise<{
  kpi: PlatformStats
  revenueData: RevenueData[]
  registrationTrends: RegistrationTrendData[]
  eventTypeDistribution: EventTypeDistribution[]
}> {
  const supabase = await createClient()

  // Calculate date range
  const now = new Date()
  const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 365
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Get total events count
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())

  // Get total registrations
  const { data: registrations } = await (supabase
    .from('registrations') as any)
    .select('total_amount, payment_status, status, checked_in_at')
    .gte('registered_at', startDate.toISOString())

  const totalAttendees = registrations?.length || 0
  const totalCheckedIn = registrations?.filter((r: any) => r.checked_in_at).length || 0

  // Calculate total revenue from paid registrations
  const totalRevenue = registrations?.reduce((sum: number, r: any) => {
    return r.payment_status === 'paid' ? sum + (r.total_amount || 0) : sum
  }, 0) || 0

  const avgCheckInRate = totalAttendees > 0 ? (totalCheckedIn / totalAttendees) * 100 : 0

  // Get revenue by month (last 6 months)
  const revenueByMonth = new Map<string, { current: number; previous: number }>()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleString('default', { month: 'short' })
    revenueByMonth.set(monthKey, { current: 0, previous: 0 })
  }

  registrations?.forEach((r: any) => {
    const regDate = new Date(r.registered_at)
    const monthKey = regDate.toLocaleString('default', { month: 'short' })
    if (revenueByMonth.has(monthKey) && r.payment_status === 'paid') {
      const data = revenueByMonth.get(monthKey)!
      data.current += r.total_amount || 0
    }
  })

  const revenueData: RevenueData[] = Array.from(revenueByMonth.entries()).map(([month, data]) => ({
    month,
    current: data.current,
    previous: Math.round(data.current * 0.75), // Mock previous period
    target: Math.round(data.current * 1.1),
  }))

  // Get registration trends by week
  const weeklyData = new Map<string, { registrations: number; checkIns: number }>()
  const weeks = Math.ceil(days / 7)

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now.getTime() - (weeks - i) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const weekKey = `Week ${i + 1}`

    const weekRegs = registrations?.filter((r: any) => {
      const regDate = new Date(r.registered_at)
      return regDate >= weekStart && regDate < weekEnd
    }) || []

    weeklyData.set(weekKey, {
      registrations: weekRegs.length,
      checkIns: weekRegs.filter((r: any) => r.checked_in_at).length,
    })
  }

  const registrationTrends: RegistrationTrendData[] = Array.from(weeklyData.entries()).map(
    ([date, data]) => ({
      date,
      registrations: data.registrations,
      checkIns: data.checkIns,
      target: Math.round(data.registrations * 1.1),
    })
  )

  // Get event type distribution
  const { data: events } = await supabase
    .from('events')
    .select('event_type')

  const typeCounts = new Map<string, number>()
  events?.forEach((e: any) => {
    typeCounts.set(e.event_type, (typeCounts.get(e.event_type) || 0) + 1)
  })

  const totalEventCount = events?.length || 0
  const eventTypeDistribution: EventTypeDistribution[] = Array.from(typeCounts.entries()).map(
    ([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((count / totalEventCount) * 100),
      count,
    })
  )

  return {
    kpi: {
      totalRevenue,
      totalEvents: totalEvents || 0,
      totalAttendees,
      avgCheckInRate: Math.round(avgCheckInRate * 10) / 10,
    },
    revenueData,
    registrationTrends,
    eventTypeDistribution,
  }
}

export async function getEventOrganizerRanking(limit: number = 10): Promise<
  Array<{
    organizer_id: string
    organizer_name?: string
    events: number
    attendees: number
    revenue: number
    growth: number
  }>
> {
  const supabase = await createClient()

  const { data: events } = await (supabase
    .from('events') as any)
    .select('organizer_id, registrations(total_amount, payment_status)')

  if (!events) return []

  // Group by organizer
  const organizerData = new Map<
    string,
    { events: number; attendees: number; revenue: number; currentMonth: number; lastMonth: number }
  >()

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  events?.forEach((e: any) => {
    const oid = e.organizer_id
    if (!organizerData.has(oid)) {
      organizerData.set(oid, { events: 0, attendees: 0, revenue: 0, currentMonth: 0, lastMonth: 0 })
    }

    const data = organizerData.get(oid)!
    data.events += 1
    data.attendees += e.registrations?.length || 0

    e.registrations?.forEach((r: any) => {
      if (r.payment_status === 'paid') {
        data.revenue += r.total_amount || 0

        const regDate = new Date(r.registered_at)
        if (regDate >= currentMonthStart) {
          data.currentMonth += r.total_amount || 0
        } else if (regDate >= lastMonthStart && regDate < currentMonthStart) {
          data.lastMonth += r.total_amount || 0
        }
      }
    })
  })

  // Calculate growth and convert to array
  const ranking = Array.from(organizerData.entries())
    .map(([organizer_id, data]) => {
      const growth =
        data.lastMonth > 0 ? ((data.currentMonth - data.lastMonth) / data.lastMonth) * 100 : 0

      return {
        organizer_id,
        events: data.events,
        attendees: data.attendees,
        revenue: data.revenue,
        growth: Math.round(growth),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return ranking
}
