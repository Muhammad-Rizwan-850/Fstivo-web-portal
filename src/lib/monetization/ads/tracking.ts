// =====================================================
// AD TRACKING & ANALYTICS
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface AdTrackingEvent {
  id: string;
  adId: string;
  eventType: 'impression' | 'click' | 'conversion';
  userId?: string;
  sessionId?: string;
  page?: string;
  placement?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdPerformance {
  adId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  conversionRate: number; // Conversion rate
  cpc: number; // Cost per click
  cpm: number; // Cost per thousand impressions
  cpa: number; // Cost per acquisition
  spend: number;
  roi: number; // Return on investment
}

export interface AdDailyStats {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
}

/**
 * Record ad tracking event
 */
export async function recordAdEvent(
  adId: string,
  eventType: 'impression' | 'click' | 'conversion',
  context?: {
    userId?: string;
    sessionId?: string;
    page?: string;
    placement?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: eventType,
      user_id: context?.userId,
      session_id: context?.sessionId,
      page: context?.page,
      placement: context?.placement,
      metadata: context?.metadata,
    });

    if (error) {
      logger.error('Error recording ad event:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error recording ad event:', error);
    return false;
  }
}

/**
 * Get ad performance metrics
 */
export async function getAdPerformance(adId: string): Promise<AdPerformance | null> {
  try {
    const supabase = await createServerClient();

    // Get ad details
    const { data: ad, error: adError } = await supabase
      .from('banner_ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return null;
    }

    // Get tracking events
    const { data: events, error: eventsError } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('ad_id', adId);

    if (eventsError) {
      return null;
    }

    const impressions = events?.filter((e: any) => e.event_type === 'impression').length || 0;
    const clicks = events?.filter((e: any) => e.event_type === 'click').length || 0;
    const conversions = events?.filter((e: any) => e.event_type === 'conversion').length || 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpc = clicks > 0 ? (ad.spent || 0) / clicks : 0;
    const cpm = impressions > 0 ? ((ad.spent || 0) / impressions) * 1000 : 0;
    const cpa = conversions > 0 ? (ad.spent || 0) / conversions : 0;

    // ROI calculation would need conversion value data
    const roi = 0;

    return {
      adId,
      impressions,
      clicks,
      conversions,
      ctr,
      conversionRate,
      cpc,
      cpm,
      cpa,
      spend: ad.spent || 0,
      roi,
    };
  } catch (error) {
    logger.error('Error getting ad performance:', error);
    return null;
  }
}

/**
 * Get daily stats for an ad
 */
export async function getAdDailyStats(
  adId: string,
  days: number = 30
): Promise<AdDailyStats[]> {
  try {
    const supabase = await createServerClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('ad_id', adId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    // Group by day
    const dailyStats: Record<string, AdDailyStats> = {};

    for (const event of events || []) {
      const date = new Date(event.created_at).toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          ctr: 0,
        };
      }

      if (event.event_type === 'impression') {
        dailyStats[date].impressions++;
      } else if (event.event_type === 'click') {
        dailyStats[date].clicks++;
      } else if (event.event_type === 'conversion') {
        dailyStats[date].conversions++;
      }
    }

    // Calculate CTR for each day
    return Object.values(dailyStats).map((stat) => ({
      ...stat,
      ctr: stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0,
    }));
  } catch (error) {
    logger.error('Error getting ad daily stats:', error);
    return [];
  }
}

/**
 * Get performance comparison for multiple ads
 */
export async function compareAdsPerformance(adIds: string[]): Promise<AdPerformance[]> {
  try {
    const performances = await Promise.all(
      adIds.map(async (adId) => {
        const perf = await getAdPerformance(adId);
        return perf;
      })
    );

    return performances.filter((p): p is AdPerformance => p !== null);
  } catch (error) {
    logger.error('Error comparing ads performance:', error);
    return [];
  }
}

/**
 * Track conversion (after click leads to action)
 */
export async function trackConversion(
  adId: string,
  conversionValue?: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: 'conversion',
      metadata: {
        ...metadata,
        conversion_value: conversionValue,
      },
    });

    if (error) {
      logger.error('Error tracking conversion:', error);
      return false;
    }

    // Update ad conversion value if provided
    if (conversionValue) {
      const { error: updateError } = await supabase
        .from('banner_ads')
        .update({
          conversion_value: (conversionValue || 0),
        })
        .eq('id', adId);

      if (updateError) {
        logger.error('Error updating conversion value:', updateError);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error tracking conversion:', error);
    return false;
  }
}

/**
 * Get conversion path (user journey from impression to conversion)
 */
export async function getConversionPath(adId: string): Promise<
  Array<{
    sessionId: string;
    events: Array<{
      type: string;
      timestamp: string;
    }>;
    converted: boolean;
  }>
> {
  try {
    const supabase = await createServerClient();

    const { data: events, error } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('ad_id', adId)
      .not('session_id', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    // Group by session
    const sessions: Record<string, any> = {};

    for (const event of events || []) {
      const sessionId = event.session_id;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          sessionId,
          events: [],
          converted: false,
        };
      }

      sessions[sessionId].events.push({
        type: event.event_type,
        timestamp: event.created_at,
      });

      if (event.event_type === 'conversion') {
        sessions[sessionId].converted = true;
      }
    }

    return Object.values(sessions);
  } catch (error) {
    logger.error('Error getting conversion path:', error);
    return [];
  }
}

/**
 * Calculate attribution (first-click, last-click, or linear)
 */
export async function calculateAttribution(
  conversionId: string,
  model: 'first_click' | 'last_click' | 'linear' = 'last_click'
): Promise<Record<string, number>> {
  try {
    const supabase = await createServerClient();

    // Get conversion event
    const { data: conversion } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('id', conversionId)
      .eq('event_type', 'conversion')
      .single();

    if (!conversion || !conversion.session_id) {
      return {};
    }

    // Get all events in the session
    const { data: events } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('session_id', conversion.session_id)
      .order('created_at', { ascending: true });

    if (!events || events.length === 0) {
      return {};
    }

    const attribution: Record<string, number> = {};

    if (model === 'first_click') {
      // First click gets 100% credit
      const firstClick = events.find((e: any) => e.event_type === 'click');
      if (firstClick) {
        attribution[firstClick.ad_id] = 100;
      }
    } else if (model === 'last_click') {
      // Last click gets 100% credit
      const clicks = events.filter((e: any) => e.event_type === 'click');
      const lastClick = clicks[clicks.length - 1];
      if (lastClick) {
        attribution[lastClick.ad_id] = 100;
      }
    } else if (model === 'linear') {
      // All clicks get equal credit
      const clicks = events.filter((e: any) => e.event_type === 'click');
      const creditPerClick = clicks.length > 0 ? 100 / clicks.length : 0;

      for (const click of clicks) {
        attribution[click.ad_id] = (attribution[click.ad_id] || 0) + creditPerClick;
      }
    }

    return attribution;
  } catch (error) {
    logger.error('Error calculating attribution:', error);
    return {};
  }
}

/**
 * Get top performing ads
 */
export async function getTopPerformingAds(
  limit: number = 10,
  sortBy: 'impressions' | 'clicks' | 'conversions' | 'ctr' = 'conversions'
): Promise<Array<{ adId: string; score: number }>> {
  try {
    const supabase = await createServerClient();

    const { data: ads, error } = await supabase
      .from('v_ad_performance')
      .select('*')
      .order(sortBy === 'ctr' ? 'ctr' : sortBy, { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (ads || []).map((ad: any) => ({
      adId: ad.id,
      score: ad[sortBy] || 0,
    }));
  } catch (error) {
    logger.error('Error getting top performing ads:', error);
    return [];
  }
}

/**
 * Detect suspicious activity (click fraud)
 */
export async function detectSuspiciousActivity(
  adId: string,
  threshold: number = 10
): Promise<Array<{ type: string; count: number; details: any }>> {
  try {
    const supabase = await createServerClient();

    const suspicious: Array<{ type: string; count: number; details: any }> = [];

    // Check for rapid clicks from same user
    const { data: userClicks } = await supabase
      .from('ad_tracking')
      .select('user_id, created_at')
      .eq('ad_id', adId)
      .eq('event_type', 'click')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

    const clicksByUser: Record<string, number> = {};
    for (const click of userClicks || []) {
      clicksByUser[click.user_id || 'anonymous'] =
        (clicksByUser[click.user_id || 'anonymous'] || 0) + 1;
    }

    for (const [userId, count] of Object.entries(clicksByUser)) {
      if (count > threshold) {
        suspicious.push({
          type: 'rapid_clicks',
          count,
          details: { userId, threshold },
        });
      }
    }

    // Check for high CTR (could indicate bot traffic)
    const perf = await getAdPerformance(adId);
    if (perf && perf.ctr > 50) {
      suspicious.push({
        type: 'high_ctr',
        count: Math.round(perf.ctr),
        details: { ctr: perf.ctr },
      });
    }

    return suspicious;
  } catch (error) {
    logger.error('Error detecting suspicious activity:', error);
    return [];
  }
}

/**
 * Get ad performance report
 */
export async function generateAdPerformanceReport(
  adId: string,
  days: number = 30
): Promise<any> {
  try {
    const [performance, dailyStats] = await Promise.all([
      getAdPerformance(adId),
      getAdDailyStats(adId, days),
    ]);

    return {
      adId,
      reportGenerated: new Date().toISOString(),
      period: { days },
      summary: performance,
      dailyBreakdown: dailyStats,
    };
  } catch (error) {
    logger.error('Error generating performance report:', error);
    return null;
  }
}
