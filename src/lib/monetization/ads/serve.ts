// =====================================================
// AD SERVING SYSTEM
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface BannerAd {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  destinationUrl: string;
  callToAction?: string;
  placement: string;
  budgetType: 'daily' | 'total';
  budgetAmount: number;
  dailyBudget?: number;
  startDate: string;
  endDate?: string;
  status: 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected';
  advertiserId: string;
  targetCategories?: string[];
  targetCities?: string[];
  createdAt: string;
}

export interface AdServingContext {
  placement: string;
  page?: string;
  category?: string;
  city?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Get active ads for a placement
 */
export async function getAdsForPlacement(context: AdServingContext): Promise<BannerAd[]> {
  try {
    const supabase = await createServerClient();

    const now = new Date().toISOString();

    let query = supabase
      .from('banner_ads')
      .select('*')
      .eq('status', 'active')
      .eq('placement', context.placement)
      .lte('start_date', now)
      .order('created_at', { ascending: false });

    // Filter by end date if specified
    query = query.or('end_date.is.null,end_date.gte.' + now);

    const { data: ads, error } = await query;

    if (error) {
      logger.error('Error getting ads:', error);
      return [];
    }

    // Filter by targeting criteria
    let eligibleAds = ads || [];

    // Filter by category
    if (context.category && eligibleAds.length > 0) {
      const categoryMatched = eligibleAds.filter((ad: any) => {
        if (!ad.target_categories || ad.target_categories.length === 0) return true;
        return ad.target_categories.includes(context.category);
      });
      eligibleAds = categoryMatched;
    }

    // Filter by city
    if (context.city && eligibleAds.length > 0) {
      const cityMatched = eligibleAds.filter((ad: any) => {
        if (!ad.target_cities || ad.target_cities.length === 0) return true;
        return ad.target_cities.includes(context.city);
      });
      eligibleAds = cityMatched;
    }

    // Check budget constraints
    eligibleAds = await Promise.all(
      eligibleAds.map(async (ad: any) => {
        const hasBudget = await checkAdBudget(ad.id);
        return hasBudget ? ad : null;
      })
    );

    return eligibleAds.filter((ad) => ad !== null) as BannerAd[];
  } catch (error) {
    logger.error('Error getting ads for placement:', error);
    return [];
  }
}

/**
 * Get a single ad for display (with rotation logic)
 */
export async function getAdForDisplay(context: AdServingContext): Promise<BannerAd | null> {
  try {
    const ads = await getAdsForPlacement(context);

    if (ads.length === 0) {
      return null;
    }

    // Simple rotation: return first ad
    // In production, would use more sophisticated rotation (weights, performance, etc.)
    const randomIndex = Math.floor(Math.random() * ads.length);
    return ads[randomIndex];
  } catch (error) {
    logger.error('Error getting ad for display:', error);
    return null;
  }
}

/**
 * Serve ad HTML
 */
export function serveAdHTML(ad: BannerAd): string {
  return `
    <div class="banner-ad" data-ad-id="${ad.id}">
      <a href="${ad.destinationUrl}" target="_blank" rel="noopener sponsored">
        <img src="${ad.imageUrl}" alt="${ad.title}" />
        ${ad.callToAction ? `<span class="cta">${ad.callToAction}</span>` : ''}
      </a>
    </div>
  `;
}

/**
 * Serve ad JSON (for API responses)
 */
export function serveAdJSON(ad: BannerAd): Record<string, any> {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    destinationUrl: ad.destinationUrl,
    callToAction: ad.callToAction,
    placement: ad.placement,
    html: serveAdHTML(ad),
  };
}

/**
 * Track ad impression (called when ad is displayed)
 */
export async function trackAdImpression(adId: string, context: AdServingContext): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Record impression
    const { error: trackingError } = await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: 'impression',
      user_id: context.userId,
      session_id: context.sessionId,
      page: context.page,
      placement: context.placement,
    });

    if (trackingError) {
      logger.error('Error recording impression:', trackingError);
    }

    // Increment counter
    const { error: incrementError } = await supabase.rpc('increment', {
      tbl: 'banner_ads',
      col_name: 'impressions',
      row_id: adId,
    });

    if (incrementError) {
      logger.error('Error incrementing impressions:', incrementError);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error tracking impression:', error);
    return false;
  }
}

/**
 * Track ad click (called when user clicks ad)
 */
export async function trackAdClick(adId: string, context: AdServingContext): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    // Record click
    const { error: trackingError } = await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: 'click',
      user_id: context.userId,
      session_id: context.sessionId,
      page: context.page,
      placement: context.placement,
    });

    if (trackingError) {
      logger.error('Error recording click:', trackingError);
    }

    // Increment counter
    const { error: incrementError } = await supabase.rpc('increment', {
      tbl: 'banner_ads',
      col_name: 'clicks',
      row_id: adId,
    });

    if (incrementError) {
      logger.error('Error incrementing clicks:', incrementError);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error tracking click:', error);
    return false;
  }
}

/**
 * Get ad by ID
 */
export async function getAdById(adId: string): Promise<BannerAd | null> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('banner_ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      destinationUrl: data.destination_url,
      callToAction: data.call_to_action,
      placement: data.placement,
      budgetType: data.budget_type,
      budgetAmount: data.budget_amount,
      dailyBudget: data.daily_budget,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
      advertiserId: data.advertiser_id,
      targetCategories: data.target_categories,
      targetCities: data.target_cities,
      createdAt: data.created_at,
    };
  } catch (error) {
    logger.error('Error getting ad by ID:', error);
    return null;
  }
}

/**
 * Pause ad
 */
export async function pauseAd(adId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('banner_ads')
      .update({ status: 'paused' })
      .eq('id', adId);

    if (error) {
      logger.error('Error pausing ad:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error pausing ad:', error);
    return false;
  }
}

/**
 * Resume ad
 */
export async function resumeAd(adId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('banner_ads')
      .update({ status: 'active' })
      .eq('id', adId);

    if (error) {
      logger.error('Error resuming ad:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error resuming ad:', error);
    return false;
  }
}

/**
 * Delete ad
 */
export async function deleteAd(adId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('banner_ads')
      .update({ status: 'deleted' })
      .eq('id', adId);

    if (error) {
      logger.error('Error deleting ad:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting ad:', error);
    return false;
  }
}

/**
 * Get user's ads
 */
export async function getUserAds(userId: string): Promise<BannerAd[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('banner_ads')
      .select('*')
      .eq('advertiser_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting user ads:', error);
      return [];
    }

    return data.map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.image_url,
      destinationUrl: ad.destination_url,
      callToAction: ad.call_to_action,
      placement: ad.placement,
      budgetType: ad.budget_type,
      budgetAmount: ad.budget_amount,
      dailyBudget: ad.daily_budget,
      startDate: ad.start_date,
      endDate: ad.end_date,
      status: ad.status,
      advertiserId: ad.advertiser_id,
      targetCategories: ad.target_categories,
      targetCities: ad.target_cities,
      createdAt: ad.created_at,
    }));
  } catch (error) {
    logger.error('Error getting user ads:', error);
    return [];
  }
}

/**
 * Check if ad has remaining budget
 */
async function checkAdBudget(adId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { data: ad, error } = await supabase
      .from('banner_ads')
      .select('budget_type, budget_amount, daily_budget, spent')
      .eq('id', adId)
      .single();

    if (error || !ad) {
      return false;
    }

    const spent = ad.spent || 0;

    // Check total budget
    if (ad.budget_type === 'total' && spent >= ad.budget_amount) {
      return false;
    }

    // Check daily budget
    if (ad.budget_type === 'daily' && ad.daily_budget) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySpent } = await supabase
        .from('ad_tracking')
        .select('created_at')
        .eq('ad_id', adId)
        .gte('created_at', today)
        .lte('created_at', today + 'T23:59:59');

      // This is simplified - would need actual spend calculation
      // For now, just check if we haven't exceeded budget
      return spent < ad.daily_budget;
    }

    return true;
  } catch (error) {
    logger.error('Error checking ad budget:', error);
    return false;
  }
}

/**
 * Get available placements
 */
export function getAvailablePlacements(): Array<{
  id: string;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
}> {
  return [
    {
      id: 'homepage_hero',
      name: 'Homepage Hero',
      description: 'Large banner at the top of homepage',
      dimensions: { width: 1920, height: 600 },
    },
    {
      id: 'homepage_below_hero',
      name: 'Homepage Below Hero',
      description: 'Banner below the hero section',
      dimensions: { width: 1200, height: 300 },
    },
    {
      id: 'sidebar',
      name: 'Sidebar',
      description: 'Vertical sidebar banner',
      dimensions: { width: 300, height: 250 },
    },
    {
      id: 'event_listing_top',
      name: 'Event Listing Top',
      description: 'Banner above event listings',
      dimensions: { width: 1200, height: 200 },
    },
    {
      id: 'event_listing_bottom',
      name: 'Event Listing Bottom',
      description: 'Banner below event listings',
      dimensions: { width: 1200, height: 200 },
    },
  ];
}
