/**
 * Analytics Query Functions
 * Database queries for event analytics, revenue tracking, and performance metrics
 */

import { createClient } from '@/lib/auth/config'
import type {
  AttendanceTracking,
  RevenueAnalytics,
  MarketingFunnel,
  AttendeeDemographics,
  EngagementHeatmap,
  AnalyticsReport,
  TrafficSource,
  CustomMetric
} from '@/types/analytics'

// ============================================================================
// ATTENDANCE TRACKING
// ============================================================================

export async function getAttendanceTracking(
  eventId: string,
  timeRange?: { start: Date; end: Date }
) {
  const supabase = await createClient()

  let query = supabase
    .from('attendance_tracking')
    .select('*')
    .eq('event_id', eventId)
    .order('timestamp', { ascending: false })

  if (timeRange) {
    query = query.gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data as AttendanceTracking[]
}

export async function recordAttendanceTracking(
  eventId: string,
  checkedInCount: number,
  totalRegistered: number
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('attendance_tracking') as any)
    .insert({
      event_id: eventId,
      checked_in_count: checkedInCount,
      total_registered: totalRegistered
    })
    .select()
    .single()

  if (error) throw error
  return data as AttendanceTracking
}

export async function getLatestAttendanceStats(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_tracking')
    .select('*')
    .eq('event_id', eventId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as AttendanceTracking | null
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export async function getRevenueAnalytics(
  eventId: string,
  periodStart?: Date,
  periodEnd?: Date
) {
  const supabase = await createClient()

  let query = supabase
    .from('revenue_analytics')
    .select('*')
    .eq('event_id', eventId)
    .order('period_start', { ascending: false })

  if (periodStart && periodEnd) {
    query = query.gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data as RevenueAnalytics[]
}

export async function getRevenueSummary(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('revenue_analytics') as any)
    .select('total_revenue, net_revenue, ticket_revenue, sponsorship_revenue, refund_amount')
    .eq('event_id', eventId)

  if (error) throw error

  const summary = {
    totalRevenue: 0,
    netRevenue: 0,
    ticketRevenue: 0,
    sponsorshipRevenue: 0,
    refundAmount: 0
  }

  if (data) {
    data.forEach((item: any) => {
      summary.totalRevenue += Number(item.total_revenue)
      summary.netRevenue += Number(item.net_revenue)
      summary.ticketRevenue += Number(item.ticket_revenue)
      summary.sponsorshipRevenue += Number(item.sponsorship_revenue)
      summary.refundAmount += Number(item.refund_amount)
    })
  }

  return summary
}

export async function recordRevenueAnalytics(
  eventId: string,
  periodStart: Date,
  periodEnd: Date,
  revenueData: {
    ticketRevenue?: number
    sponsorshipRevenue?: number
    merchandiseRevenue?: number
    otherRevenue?: number
    refundAmount?: number
    transactionsCount?: number
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('revenue_analytics') as any)
    .insert({
      event_id: eventId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      ticket_revenue: revenueData.ticketRevenue || 0,
      sponsorship_revenue: revenueData.sponsorshipRevenue || 0,
      merchandise_revenue: revenueData.merchandiseRevenue || 0,
      other_revenue: revenueData.otherRevenue || 0,
      refund_amount: revenueData.refundAmount || 0,
      transactions_count: revenueData.transactionsCount || 0
    })
    .select()
    .single()

  if (error) throw error
  return data as RevenueAnalytics
}

// ============================================================================
// MARKETING FUNNEL
// ============================================================================

export async function getMarketingFunnel(
  eventId: string,
  startDate?: Date,
  endDate?: Date
) {
  const supabase = await createClient()

  let query = supabase
    .from('marketing_funnel')
    .select('*')
    .eq('event_id', eventId)
    .order('funnel_date', { ascending: false })

  if (startDate) {
    query = query.gte('funnel_date', startDate.toISOString().split('T')[0])
  }

  if (endDate) {
    query = query.lte('funnel_date', endDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) throw error
  return data as MarketingFunnel[]
}

export async function recordFunnelMetrics(
  eventId: string,
  funnelDate: Date,
  metrics: {
    pageViews?: number
    uniqueVisitors?: number
    registrationClicks?: number
    registrationsStarted?: number
    registrationsCompleted?: number
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('marketing_funnel') as any)
    .upsert({
      event_id: eventId,
      funnel_date: funnelDate.toISOString().split('T')[0],
      page_views: metrics.pageViews || 0,
      unique_visitors: metrics.uniqueVisitors || 0,
      registration_clicks: metrics.registrationClicks || 0,
      registrations_started: metrics.registrationsStarted || 0,
      registrations_completed: metrics.registrationsCompleted || 0
    }, {
      onConflict: 'event_id,funnel_date'
    })
    .select()
    .single()

  if (error) throw error
  return data as MarketingFunnel
}

export async function getFunnelConversionRate(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('marketing_funnel') as any)
    .select('conversion_rate, drop_off_rate')
    .eq('event_id', eventId)
    .order('funnel_date', { ascending: false })
    .limit(30)

  if (error) throw error

  return {
    averageConversionRate: data?.reduce((acc: number, curr: any) =>
      acc + Number(curr.conversion_rate), 0) / (data?.length || 1),
    averageDropOffRate: data?.reduce((acc: number, curr: any) =>
      acc + Number(curr.drop_off_rate), 0) / (data?.length || 1),
    dailyData: data
  }
}

// ============================================================================
// ATTENDEE DEMOGRAPHICS
// ============================================================================

export async function getAttendeeDemographics(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendee_demographics')
    .select('*')
    .eq('event_id', eventId)

  if (error) throw error
  return data as AttendeeDemographics[]
}

export async function updateAttendeeDemographics(
  eventId: string,
  demographics: {
    ageGroup?: string
    gender?: string
    locationCity?: string
    locationCountry?: string
    profession?: string
    industry?: string
    attendeeCount?: number
  }[]
) {
  const supabase = await createClient()

  const records = demographics.map(d => ({
    event_id: eventId,
    ...d
  }))

  const { data, error } = await (supabase
    .from('attendee_demographics') as any)
    .insert(records)
    .select()

  if (error) throw error
  return data as AttendeeDemographics[]
}

// ============================================================================
// ENGAGEMENT HEATMAPS
// ============================================================================

export async function getEngagementHeatmaps(
  eventId: string,
  startDate?: Date,
  endDate?: Date
) {
  const supabase = await createClient()

  let query = supabase
    .from('engagement_heatmaps')
    .select('*')
    .eq('event_id', eventId)
    .order('measurement_date', { ascending: false })
    .order('hour_of_day', { ascending: true })

  if (startDate) {
    query = query.gte('measurement_date', startDate.toISOString().split('T')[0])
  }

  if (endDate) {
    query = query.lte('measurement_date', endDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) throw error
  return data as EngagementHeatmap[]
}

export async function recordEngagementMetrics(
  eventId: string,
  measurementDate: Date,
  hourOfDay: number,
  metrics: {
    activityLevel?: number
    checkIns?: number
    engagementScore?: number
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('engagement_heatmaps') as any)
    .upsert({
      event_id: eventId,
      measurement_date: measurementDate.toISOString().split('T')[0],
      hour_of_day: hourOfDay,
      activity_level: metrics.activityLevel || 0,
      check_ins: metrics.checkIns || 0,
      engagement_score: metrics.engagementScore || 0
    }, {
      onConflict: 'event_id,measurement_date,hour_of_day'
    })
    .select()
    .single()

  if (error) throw error
  return data as EngagementHeatmap
}

// ============================================================================
// ANALYTICS REPORTS
// ============================================================================

export async function createAnalyticsReport(
  eventId: string,
  createdBy: string,
  reportData: {
    reportType: string
    reportName: string
    dateRangeStart?: Date
    dateRangeEnd?: Date
    filters?: Record<string, any>
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('analytics_reports') as any)
    .insert({
      event_id: eventId,
      created_by: createdBy,
      report_type: reportData.reportType,
      report_name: reportData.reportName,
      date_range_start: reportData.dateRangeStart?.toISOString().split('T')[0],
      date_range_end: reportData.dateRangeEnd?.toISOString().split('T')[0],
      filters: reportData.filters as any,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as AnalyticsReport
}

export async function getAnalyticsReports(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analytics_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AnalyticsReport[]
}

export async function updateReportStatus(
  reportId: string,
  status: 'generating' | 'completed' | 'failed',
  fileUrl?: string
) {
  const supabase = await createClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    updateData.generated_at = new Date().toISOString()
  }

  if (fileUrl) {
    updateData.file_url = fileUrl
  }

  const { data, error } = await (supabase
    .from('analytics_reports') as any)
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single()

  if (error) throw error
  return data as AnalyticsReport
}

// ============================================================================
// TRAFFIC SOURCES
// ============================================================================

export async function getTrafficSources(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('traffic_sources')
    .select('*')
    .eq('event_id', eventId)
    .order('visits', { ascending: false })

  if (error) throw error
  return data as TrafficSource[]
}

export async function recordTrafficSource(
  eventId: string,
  sourceData: {
    source: string
    medium?: string
    campaign?: string
    revenueGenerated?: number
    costPerAcquisition?: number
  }
) {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Check if source exists for today
  const { data: existing } = await (supabase
    .from('traffic_sources') as any)
    .select('*')
    .eq('event_id', eventId)
    .eq('source', sourceData.source)
    .eq('first_seen', today)
    .single()

  if (existing) {
    // Update existing record
    const { data, error } = await (supabase
      .from('traffic_sources') as any)
      .update({
        visits: existing.visits + 1,
        last_seen: today,
        revenue_generated: sourceData.revenueGenerated || existing.revenue_generated,
        cost_per_acquisition: sourceData.costPerAcquisition || existing.cost_per_acquisition
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data as TrafficSource
  } else {
    // Create new record
    const { data, error } = await (supabase
      .from('traffic_sources') as any)
      .insert({
        event_id: eventId,
        source: sourceData.source,
        medium: sourceData.medium,
        campaign: sourceData.campaign,
        visits: 1,
        first_seen: today,
        last_seen: today,
        revenue_generated: sourceData.revenueGenerated || 0,
        cost_per_acquisition: sourceData.costPerAcquisition || 0
      })
      .select()
      .single()

    if (error) throw error
    return data as TrafficSource
  }
}

export async function getTopTrafficSources(eventId: string, limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('traffic_sources')
    .select('*')
    .eq('event_id', eventId)
    .order('roi', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as TrafficSource[]
}

// ============================================================================
// CUSTOM METRICS
// ============================================================================

export async function getCustomMetrics(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('custom_metrics')
    .select('*')
    .eq('event_id', eventId)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data as CustomMetric[]
}

export async function recordCustomMetric(
  eventId: string,
  metricName: string,
  metricValue: number,
  options?: {
    metricUnit?: string
    metadata?: Record<string, any>
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('custom_metrics') as any)
    .insert({
      event_id: eventId,
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: options?.metricUnit,
      metadata: options?.metadata as any
    })
    .select()
    .single()

  if (error) throw error
  return data as CustomMetric
}

// ============================================================================
// EVENT PERFORMANCE VIEW
// ============================================================================

export async function getEventPerformance(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_event_performance')
    .select('*')
    .eq('event_id', eventId)
    .single()

  if (error) throw error
  return data
}

export async function getAllEventsPerformance(organizerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_event_performance')
    .select('*')
    .in('event_id', (supabase
      .from('events') as any)
      .select('id')
      .eq('organizer_id', organizerId)
    )

  if (error) throw error
  return data
}
