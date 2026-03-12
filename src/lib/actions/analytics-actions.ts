// =====================================================
// ANALYTICS ACTIONS - SERVER ACTIONS
// =====================================================
// File: src/lib/actions/analytics-actions.ts
// Features: Event analytics, tracking, reports
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// ANALYTICS ACTIONS
// ============================================================================

export async function getEventAnalytics(eventId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Get comprehensive analytics
    const [
      { data: performance },
      { data: revenue },
      { data: funnel },
      { data: demographics },
      { data: trafficSources }
    ] = await Promise.all([
      supabase.from('v_event_performance').select('*').eq('event_id', eventId).single(),
      supabase.from('revenue_analytics').select('*').eq('event_id', eventId).order('date', { ascending: false }),
      supabase.from('v_funnel_conversion').select('*').eq('event_id', eventId).single(),
      supabase.from('attendee_demographics').select('*').eq('event_id', eventId),
      supabase.from('traffic_sources').select('*').eq('event_id', eventId).order('date', { ascending: false }).limit(30)
    ]);

    return {
      performance,
      revenue,
      funnel,
      demographics,
      trafficSources
    };
  } catch (error) {
    logger.error('Failed to get event analytics', error as Error, { eventId });
    return { error: 'Failed to fetch analytics' };
  }
}

export async function trackMarketingFunnel(
  eventId: string,
  stage: string,
  source?: string,
  medium?: string,
  campaign?: string
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await (supabase.from('marketing_funnel') as any).insert({
      event_id: eventId,
      stage,
      user_id: user?.id,
      source,
      medium,
      campaign,
      session_id: Math.random().toString(36).substring(7)
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    logger.error('Failed to track marketing funnel', error as Error);
    return { error: 'Failed to track funnel' };
  }
}

export async function generateAnalyticsReport(
  eventId: string,
  reportType: string,
  format: 'pdf' | 'excel' | 'csv',
  parameters?: any
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Create report request
    const { data: report, error } = await (supabase
      .from('analytics_reports') as any)
      .insert({
        event_id: eventId,
        created_by: user.id,
        report_type: reportType,
        report_format: format,
        parameters,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath(`/events/${eventId}/analytics`);
    return { reportId: report.id };
  } catch (error) {
    logger.error('Failed to generate report', error as Error);
    return { error: 'Failed to generate report' };
  }
}

export async function getReportStatus(reportId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: report, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('id', reportId)
      .eq('created_by', user.id)
      .single();

    if (error) return { error: error.message };
    return { report };
  } catch (error) {
    logger.error('Failed to get report status', error as Error);
    return { error: 'Failed to fetch report' };
  }
}

export async function getEventROI(eventId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .rpc('calculate_event_roi', { p_event_id: eventId });

    if (error) return { error: error.message };
    return { roi: data };
  } catch (error) {
    logger.error('Failed to calculate ROI', error as Error);
    return { error: 'Failed to calculate ROI' };
  }
}
