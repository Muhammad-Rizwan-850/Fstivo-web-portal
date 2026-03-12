import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json(
        { error: 'Missing placement parameter' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get placement
    const { data: placementData } = await supabase
      .from('ad_placements')
      .select('*')
      .eq('slug', placement)
      .eq('is_active', true)
      .single();

    if (!placementData) {
      return NextResponse.json({ ad: null });
    }

    // Get active ad serving for this placement
    const { data: adServings } = await supabase
      .from('ad_serving')
      .select(`
        *,
        campaign:ad_campaigns(*),
        creative:ad_creatives(*)
      `)
      .eq('placement_id', placementData.id)
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .limit(10);

    if (!adServings || adServings.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Filter active campaigns within budget
    const eligibleAds = adServings.filter((serving: { campaign?: { status?: string; spent_amount?: number; total_budget?: number; start_date?: string; end_date?: string } }) => {
      const campaign = serving.campaign;
      return campaign && campaign.status === 'active' &&
             (campaign.spent_amount || 0) < (campaign.total_budget || 0) &&
             new Date() >= new Date(campaign.start_date || '') &&
             new Date() <= new Date(campaign.end_date || '');
    });

    if (eligibleAds.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Select ad (weighted random)
    const selectedAd = eligibleAds[0];

    // Generate tracking URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return NextResponse.json({
      ad: {
        ad_serving_id: selectedAd.id,
        creative: selectedAd.creative,
        tracking_params: {
          impression_url: `${baseUrl}/api/ads/impression?sid=${selectedAd.id}`,
          click_url: `${baseUrl}/api/ads/click?sid=${selectedAd.id}&url=${encodeURIComponent(selectedAd.creative.destination_url)}`
        }
      }
    });
  } catch (error) {
    logger.error('Error serving ad:', error);
    return NextResponse.json(
      { error: 'Failed to serve ad' },
      { status: 500 }
    );
  }
}
