// =====================================================
// SPONSORED EVENTS & ADS - SERVER ACTIONS
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

export async function getSponsoredSlots() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) return { error: error.message };
    return { slots: data };
  } catch (error) {
    logger.error('Failed to get sponsored slots', error as Error);
    return { error: 'Failed to fetch slots' };
  }
}

export async function bookSponsoredSlot(data: {
  event_id: string;
  slot_id: string;
  start_date: string;
  end_date: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: slot } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('id', data.slot_id)
      .single();

    if (!slot) return { error: 'Invalid slot' };

    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const totalAmount = slot.price_per_day * days;

    const { data: booking, error } = await supabase
      .from('sponsored_event_bookings')
      .insert({
        event_id: data.event_id,
        slot_id: data.slot_id,
        sponsor_user_id: user.id,
        start_date: data.start_date,
        end_date: data.end_date,
        daily_rate: slot.price_per_day,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/sponsored-events');
    return { booking };
  } catch (error) {
    logger.error('Failed to book sponsored slot', error as Error);
    return { error: 'Failed to book slot' };
  }
}

export async function createBannerAd(data: {
  title: string;
  description?: string;
  image_url: string;
  destination_url: string;
  call_to_action?: string;
  placement: string;
  budget_type: string;
  budget_amount: number;
  start_date: string;
  end_date?: string;
  target_categories?: string[];
  target_cities?: string[];
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: ad, error } = await supabase
      .from('banner_ads')
      .insert({
        ...data,
        advertiser_id: user.id,
        status: 'pending_review'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/ads');
    return { ad };
  } catch (error) {
    logger.error('Failed to create banner ad', error as Error);
    return { error: 'Failed to create ad' };
  }
}

export async function trackAdImpression(adId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: 'impression',
      user_id: user?.id,
      session_id: Math.random().toString(36).substring(7)
    });

    await supabase.rpc('increment', {
      tbl: 'banner_ads',
      col_name: 'impressions',
      row_id: adId
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to track ad impression', error as Error);
    return { error: 'Failed to track impression' };
  }
}

export async function trackAdClick(adId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('ad_tracking').insert({
      ad_id: adId,
      event_type: 'click',
      user_id: user?.id,
      session_id: Math.random().toString(36).substring(7)
    });

    await supabase.rpc('increment', {
      tbl: 'banner_ads',
      col_name: 'clicks',
      row_id: adId
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to track ad click', error as Error);
    return { error: 'Failed to track click' };
  }
}

export async function getAdPerformance(adId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: ad, error } = await supabase
      .from('v_ad_performance')
      .select('*')
      .eq('id', adId)
      .single();

    if (error) return { error: error.message };
    return { ad };
  } catch (error) {
    logger.error('Failed to get ad performance', error as Error);
    return { error: 'Failed to fetch performance' };
  }
}

export async function createSponsorProfile(data: {
  company_name: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  interested_categories?: string[];
  interested_cities?: string[];
  budget_range?: { min: number; max: number };
  sponsorship_type?: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data: profile, error } = await supabase
      .from('sponsor_profiles')
      .insert({
        ...data,
        user_id: user.id
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/sponsor-profile');
    return { profile };
  } catch (error) {
    logger.error('Failed to create sponsor profile', error as Error);
    return { error: 'Failed to create profile' };
  }
}

export async function getSponsorMatches(eventId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('sponsor_matches')
      .select(`
        *,
        sponsor:sponsor_profiles(*)
      `)
      .eq('event_id', eventId)
      .order('match_score', { ascending: false })
      .limit(10);

    if (error) return { error: error.message };
    return { matches: data };
  } catch (error) {
    logger.error('Failed to get sponsor matches', error as Error);
    return { error: 'Failed to fetch matches' };
  }
}

export async function getMySponsoredBookings() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('sponsored_event_bookings')
      .select(`
        *,
        slot:sponsored_event_slots(*),
        event:events(title, start_date, end_date)
      `)
      .eq('sponsor_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { bookings: data };
  } catch (error) {
    logger.error('Failed to get sponsored bookings', error as Error);
    return { error: 'Failed to fetch bookings' };
  }
}

export async function getMyBannerAds() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('banner_ads')
      .select('*')
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { ads: data };
  } catch (error) {
    logger.error('Failed to get banner ads', error as Error);
    return { error: 'Failed to fetch ads' };
  }
}
