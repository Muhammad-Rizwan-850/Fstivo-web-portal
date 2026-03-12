import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  campaign_id: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABTestVariant[];
  target_metric: string;
  start_date?: string;
  end_date?: string;
  winner_variant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of traffic (0-100)
  config: Record<string, any>; // Variant-specific configuration
  metrics: ABTestMetrics;
}

export interface ABTestMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  custom_metrics: Record<string, number>;
}

export interface ABTestResult {
  test_id: string;
  variant_id: string;
  user_id: string;
  action: string; // 'impression', 'click', 'conversion', etc.
  value?: number; // For revenue or custom metrics
  metadata?: Record<string, any>;
  timestamp: string;
}

class ABTestingManager {
  private tests: Map<string, ABTest> = new Map();

  async loadTests(): Promise<void> {
    try {
      const supabase = createClient();

      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select(`
          *,
          variants:ab_test_variants(*)
        `);

      if (error) {
        logger.error('Error loading A/B tests:', error);
        return;
      }

      tests?.forEach((test: any) => {
        this.tests.set(test.id, test as ABTest);
      });
    } catch (error) {
      logger.error('Error loading A/B tests:', error);
    }
  }

  async getTest(testId: string): Promise<ABTest | null> {
    if (!this.tests.has(testId)) {
      await this.loadTests();
    }
    return this.tests.get(testId) || null;
  }

  async getVariantForUser(testId: string, userId: string): Promise<ABTestVariant | null> {
    const test = await this.getTest(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Use consistent hashing to assign users to variants
    const hash = this.hashString(`${testId}:${userId}`);
    const randomValue = (hash % 100) + 1;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant if weights don't add up to 100
    return test.variants[0] || null;
  }

  async trackEvent(
    testId: string,
    variantId: string,
    userId: string,
    action: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const event: ABTestResult = {
        test_id: testId,
        variant_id: variantId,
        user_id: userId,
        action,
        value,
        metadata,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('ab_test_results')
        .insert(event);

      if (error) {
        logger.error('Error tracking A/B test event:', error);
        return false;
      }

      // Update variant metrics in real-time
      await this.updateVariantMetrics(testId, variantId);

      return true;
    } catch (error) {
      logger.error('Error tracking A/B test event:', error);
      return false;
    }
  }

  private async updateVariantMetrics(testId: string, variantId: string): Promise<void> {
    try {
      const supabase = createClient();

      // Calculate metrics for this variant
      const { data: events, error } = await supabase
        .from('ab_test_results')
        .select('action, value')
        .eq('test_id', testId)
        .eq('variant_id', variantId);

      if (error) {
        logger.error('Error calculating variant metrics:', error);
        return;
      }

      const metrics: ABTestMetrics = {
        impressions: events?.filter((e: any) => e.action === 'impression').length || 0,
        clicks: events?.filter((e: any) => e.action === 'click').length || 0,
        conversions: events?.filter((e: any) => e.action === 'conversion').length || 0,
        revenue: events?.reduce((sum: number, e: any) => sum + (e.value || 0), 0) || 0,
        custom_metrics: {},
      };

      // Update the variant metrics
      const { error: updateError } = await supabase
        .from('ab_test_variants')
        .update({
          metrics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId);

      if (updateError) {
        logger.error('Error updating variant metrics:', updateError);
      }
    } catch (error) {
      logger.error('Error updating variant metrics:', error);
    }
  }

  async getTestResults(testId: string): Promise<ABTestResult[] | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testId)
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Error fetching A/B test results:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching A/B test results:', error);
      return null;
    }
  }

  async calculateTestStatistics(testId: string): Promise<any> {
    const results = await this.getTestResults(testId);
    if (!results) return null;

    const test = await this.getTest(testId);
    if (!test) return null;

    const statistics: Record<string, any> = {};

    // Group results by variant
    const resultsByVariant = results.reduce((acc, result) => {
      if (!acc[result.variant_id]) {
        acc[result.variant_id] = [];
      }
      acc[result.variant_id].push(result);
      return acc;
    }, {} as Record<string, ABTestResult[]>);

    // Calculate statistics for each variant
    for (const [variantId, variantResults] of Object.entries(resultsByVariant)) {
      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) continue;

      const impressions = variantResults.filter(r => r.action === 'impression').length;
      const clicks = variantResults.filter(r => r.action === 'click').length;
      const conversions = variantResults.filter(r => r.action === 'conversion').length;
      const revenue = variantResults.reduce((sum, r) => sum + (r.value || 0), 0);

      statistics[variantId] = {
        variant_name: variant.name,
        impressions,
        clicks,
        conversions,
        revenue,
        click_through_rate: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conversion_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        average_order_value: conversions > 0 ? revenue / conversions : 0,
      };
    }

    return statistics;
  }

  async determineWinner(testId: string): Promise<string | null> {
    const statistics = await this.calculateTestStatistics(testId);
    if (!statistics) return null;

    const test = await this.getTest(testId);
    if (!test) return null;

    // Simple winner determination based on conversion rate
    let winnerId = null;
    let bestConversionRate = 0;

    for (const [variantId, stats] of Object.entries(statistics)) {
      const statsData = stats as any;
      if (statsData.conversion_rate > bestConversionRate) {
        bestConversionRate = statsData.conversion_rate;
        winnerId = variantId;
      }
    }

    return winnerId;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async createTest(testData: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>): Promise<ABTest | null> {
    try {
      const supabase = createClient();

      const newTest = {
        ...testData,
        id: `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ab_tests')
        .insert(newTest)
        .select()
        .single();

      if (error) {
        logger.error('Error creating A/B test:', error);
        return null;
      }

      this.tests.set(data.id, data as ABTest);
      return data as ABTest;
    } catch (error) {
      logger.error('Error creating A/B test:', error);
      return null;
    }
  }
}

// Singleton instance
export const abTesting = new ABTestingManager();

// React hook for A/B testing
export function useABTest(testId: string, userId?: string) {
  const [variant, setVariant] = React.useState<ABTestVariant | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getVariant = async () => {
      setLoading(true);
      try {
        const userVariant = await abTesting.getVariantForUser(testId, userId || 'anonymous');
        setVariant(userVariant);
      } catch (error) {
        logger.error('Error getting A/B test variant:', error);
        setVariant(null);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      getVariant();
    }
  }, [testId, userId]);

  const trackEvent = React.useCallback(async (
    action: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    if (variant && userId) {
      await abTesting.trackEvent(testId, variant.id, userId, action, value, metadata);
    }
  }, [testId, variant, userId]);

  return { variant, loading, trackEvent };
}

// Server-side A/B testing utilities
export async function getABTestVariant(testId: string, userId: string): Promise<ABTestVariant | null> {
  return await abTesting.getVariantForUser(testId, userId);
}

export async function trackABTestEvent(
  testId: string,
  variantId: string,
  userId: string,
  action: string,
  value?: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  return await abTesting.trackEvent(testId, variantId, userId, action, value, metadata);
}