import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { abTesting } from '@/lib/ab-testing';
import { logger } from '@/lib/logger';

/**
 * GET /api/ab-testing/[testId]/results
 * Get results and statistics for an A/B test (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = createClient();
    const { testId } = await params;

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get test details
    const test = await abTesting.getTest(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Get statistics
    const statistics = await abTesting.calculateTestStatistics(testId);

    // Get raw results if requested
    const { searchParams } = new URL(request.url);
    const includeRawResults = searchParams.get('include_raw') === 'true';

    let rawResults = null;
    if (includeRawResults) {
      rawResults = await abTesting.getTestResults(testId);
    }

    return NextResponse.json({
      test,
      statistics,
      raw_results: rawResults,
    });
  } catch (error) {
    logger.error('Error in GET /api/ab-testing/[testId]/results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ab-testing/[testId]/complete
 * Complete an A/B test and determine winner (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const supabase = createClient();
    const { testId } = await params;

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Determine winner
    const winnerId = await abTesting.determineWinner(testId);
    if (!winnerId) {
      return NextResponse.json({ error: 'Could not determine winner' }, { status: 400 });
    }

    // Update test status and winner
    const { error } = await supabase
      .from('ab_tests')
      .update({
        status: 'completed',
        winner_variant_id: winnerId,
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', testId);

    if (error) {
      logger.error('Error completing A/B test:', error);
      return NextResponse.json({ error: 'Failed to complete test' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      winner_variant_id: winnerId,
      message: 'Test completed successfully'
    });
  } catch (error) {
    logger.error('Error in POST /api/ab-testing/[testId]/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}