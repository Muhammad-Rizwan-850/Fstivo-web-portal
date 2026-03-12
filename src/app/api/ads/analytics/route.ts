import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaign_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaign_id parameter' },
        { status: 400 }
      );
    }

    // Verify user owns the campaign
    const { data: campaign } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('advertiser_user_id', user.id)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get aggregate metrics
    const { data: metrics } = await supabase
      .from('ad_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('date', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('date', endDate || new Date().toISOString().split('T')[0]);

    // Calculate aggregates
    const totalImpressions = metrics?.reduce((sum: number, m: any) => sum + (m.impressions || 0), 0) || 0;
    const totalClicks = metrics?.reduce((sum: number, m: any) => sum + (m.clicks || 0), 0) || 0;
    const totalSpend = metrics?.reduce((sum: number, m: any) => sum + (m.spend || 0), 0) || 0;
    const totalConversions = metrics?.reduce((sum: number, m: any) => sum + (m.conversions || 0), 0) || 0;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const roas = totalSpend > 0 ? (totalConversions * 100) / totalSpend : 0;

    // Get daily stats
    const dailyStats = metrics?.map((m: any) => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      spend: m.spend || 0,
      conversions: m.conversions || 0
    })) || [];

    // Calculate previous period for comparison
    const daysDiff = startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const prevStartDate = new Date((startDate ? new Date(startDate) : new Date()).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: prevMetrics } = await supabase
      .from('ad_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    const prevImpressions = prevMetrics?.reduce((sum: number, m: any) => sum + (m.impressions || 0), 0) || 0;
    const prevClicks = prevMetrics?.reduce((sum: number, m: any) => sum + (m.clicks || 0), 0) || 0;
    const prevSpend = prevMetrics?.reduce((sum: number, m: any) => sum + (m.spend || 0), 0) || 0;
    const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;

    // Calculate changes
    const impressionsChange = prevImpressions > 0 ? ((totalImpressions - prevImpressions) / prevImpressions) * 100 : 0;
    const clicksChange = prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks) * 100 : 0;
    const ctrChange = prevCtr > 0 ? ((ctr - prevCtr) / prevCtr) * 100 : 0;
    const spendChange = prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend) * 100 : 0;

    return NextResponse.json({
      metrics: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr,
        spend: totalSpend,
        spent_amount: campaign.spent_amount,
        total_budget: campaign.total_budget,
        conversions: totalConversions,
        avg_cpc: avgCpc,
        avg_cpm: avgCpm,
        roas: roas,
        impressions_change: impressionsChange,
        clicks_change: clicksChange,
        ctr_change: ctrChange,
        spend_change: spendChange
      },
      daily_stats: dailyStats
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
