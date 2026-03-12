import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { abTesting } from '@/lib/ab-testing';
import { logger } from '@/lib/logger';

/**
 * GET /api/ab-testing/[testId]/variant
 * Get the variant for the current user in an A/B test
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = createClient();
    const { testId } = await params;

    // Get user ID (can be anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || request.headers.get('x-anonymous-id') || 'anonymous';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const variant = await abTesting.getVariantForUser(testId, userId);

    if (!variant) {
      return NextResponse.json({ error: 'Test not found or not running' }, { status: 404 });
    }

    // Track impression automatically
    await abTesting.trackEvent(testId, variant.id, userId, 'impression');

    return NextResponse.json({ variant });
  } catch (error) {
    logger.error('Error in GET /api/ab-testing/[testId]/variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ab-testing/[testId]/variant
 * Track an event for a specific variant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = createClient();
    const { testId } = await params;

    const body = await request.json();
    const { variantId, action, value, metadata } = body;

    if (!variantId || !action) {
      return NextResponse.json({
        error: 'Missing required fields: variantId, action'
      }, { status: 400 });
    }

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || request.headers.get('x-anonymous-id') || 'anonymous';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const success = await abTesting.trackEvent(
      testId,
      variantId,
      userId,
      action,
      value,
      metadata
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in POST /api/ab-testing/[testId]/variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}