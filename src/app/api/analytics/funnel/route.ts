// =====================================================
// API ROUTE: MARKETING FUNNEL
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
import { analyticsService } from '@/lib/analytics/service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get eventId from searchParams
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Get funnel data and conversion rates
    const [funnel, conversionRates] = await Promise.all([
      analyticsService.getMarketingFunnel(eventId),
      analyticsService.getConversionRates(eventId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        conversionRates
      }
    });

  } catch (error) {
    logger.error('Marketing funnel error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
