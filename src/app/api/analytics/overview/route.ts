// =====================================================
// API ROUTE: ANALYTICS OVERVIEW
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

    // Get analytics overview
    const overview = await analyticsService.getOverview(eventId);

    if (!overview) {
      return NextResponse.json(
        { error: 'Analytics overview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: overview,
    });

  } catch (error) {
    logger.error('Analytics overview error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Get eventId from body
    const body = await request.json() as { eventId: string };
    const eventId = body.eventId;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    // Update analytics
    const success = await analyticsService.updateOverview(eventId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics updated successfully',
    });

  } catch (error) {
    logger.error('Update analytics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
