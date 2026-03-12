import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { abTesting } from '@/lib/ab-testing';
import { ABTest } from '@/lib/ab-testing';
import type { ABTestVariant } from '@/types/api';
import { logger } from '@/lib/logger';

/**
 * GET /api/ab-testing
 * Get all A/B tests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    const { data: tests, error } = await supabase
      .from('ab_tests')
      .select(`
        *,
        variants:ab_test_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching A/B tests:', error);
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
    }

    return NextResponse.json({ tests: tests || [] });
  } catch (error) {
    logger.error('Error in GET /api/ab-testing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ab-testing
 * Create a new A/B test (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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

    const body = await request.json();
    const { name, description, campaign_id, target_metric, variants } = body;

    // Validate required fields
    if (!name || !target_metric || !variants || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json({
        error: 'Missing required fields: name, target_metric, and at least 2 variants'
      }, { status: 400 });
    }

    // Validate variants
    const totalWeight = variants.reduce((sum: number, v: { weight?: number }) => sum + (v.weight || 0), 0);
    if (totalWeight !== 100) {
      return NextResponse.json({
        error: 'Variant weights must sum to 100%'
      }, { status: 400 });
    }

    // Create the test
    const testData = {
      name,
      description,
      campaign_id,
      status: 'draft' as const,
      target_metric,
      variants: variants.map((v: { name?: string; description?: string; weight?: number; config?: Record<string, unknown> }) => ({
        id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: v.name || '',
        description: v.description || '',
        weight: v.weight || 0,
        config: v.config || {},
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          custom_metrics: {},
        },
      })),
    };

    const newTest = await abTesting.createTest(testData as any);
    if (!newTest) {
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
    }

    // Insert variants
    const variantInserts = variants.map((v: { name?: string; description?: string; weight?: number; config?: Record<string, unknown> }) => ({
      test_id: newTest.id,
      name: v.name,
      description: v.description,
      weight: v.weight,
      config: v.config || {},
    }));

    const { error: variantError } = await supabase
      .from('ab_test_variants')
      .insert(variantInserts);

    if (variantError) {
      logger.error('Error creating test variants:', variantError);
      // Clean up the test if variants failed
      await supabase.from('ab_tests').delete().eq('id', newTest.id);
      return NextResponse.json({ error: 'Failed to create test variants' }, { status: 500 });
    }

    return NextResponse.json({ test: newTest }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/ab-testing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}