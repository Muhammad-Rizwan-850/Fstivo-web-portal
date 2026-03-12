// =====================================================
// API ROUTE: REVENUE ANALYTICS
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const days = parseInt(searchParams.get('days') || '7');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let analytics;

    if (startDate && endDate) {
      analytics = await analyticsService.getRevenueAnalytics(
        eventId,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      analytics = await analyticsService.getRevenueByDateRange(eventId, days);
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    logger.error('Revenue analytics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
