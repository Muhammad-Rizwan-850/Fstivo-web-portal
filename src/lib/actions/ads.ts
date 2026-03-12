'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const adSchema = z.object({
  name: z.string().min(1),
  placement: z.enum(['homepage_banner', 'sidebar', 'feed_between', 'event_page_top']),
  creative_url: z.string().url(),
  destination_url: z.string().url(),
  daily_budget: z.number().min(100),
  start_date: z.string(),
  end_date: z.string(),
  target_audience: z.object({
    categories: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    min_age: z.number().optional(),
    max_age: z.number().optional(),
  }).optional(),
});

export async function createAd(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = adSchema.parse(data);

  const { error } = await supabase
    .from('ads')
    .insert({
      ...validated,
      advertiser_id: user.id,
      status: 'pending',
      impressions: 0,
      clicks: 0,
      spend: 0,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/ads');
  return { success: true };
}

export async function updateAdStatus(adId: string, status: 'active' | 'paused' | 'ended') {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('ads')
    .update({ status })
    .eq('id', adId)
    .eq('advertiser_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/ads');
  return { success: true };
}

export async function getAdAnalytics(adId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: ad } = await supabase
    .from('ads')
    .select('*')
    .eq('id', adId)
    .eq('advertiser_id', user.id)
    .single();

  if (!ad) {
    return { error: 'Ad not found' };
  }

  const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
  const cpc = ad.clicks > 0 ? ad.spend / ad.clicks : 0;

  return {
    success: true,
    analytics: {
      impressions: ad.impressions,
      clicks: ad.clicks,
      spend: ad.spend,
      ctr: ctr.toFixed(2),
      cpc: cpc.toFixed(2),
    },
  };
}
