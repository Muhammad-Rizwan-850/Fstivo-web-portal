// =====================================================
// API ROUTE: ATTENDEE DEMOGRAPHICS
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

    // Get eventId from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Get demographics
    const demographics = await analyticsService.getDemographics(eventId);

    if (!demographics) {
      return NextResponse.json(
        { error: 'Demographics not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: demographics,
    });

  } catch (error) {
    logger.error('Demographics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
