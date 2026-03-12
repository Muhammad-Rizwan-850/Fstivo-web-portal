// =====================================================
// API ROUTE: TRACK ANALYTICS EVENTS
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics/service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, eventType, userId, eventData, sessionId } = body;

    // Validate required fields
    if (!eventId || !eventType) {
      return NextResponse.json(
        { error: 'eventId and eventType are required' },
        { status: 400 }
      );
    }

    // Track event
    const success = await analyticsService.trackEvent(
      eventId,
      eventType,
      userId,
      eventData,
      sessionId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });

  } catch (error) {
    logger.error('Track event error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
