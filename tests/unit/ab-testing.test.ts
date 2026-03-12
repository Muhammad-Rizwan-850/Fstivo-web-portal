import { abTesting, ABTest, ABTestVariant } from '@/lib/ab-testing';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })),
    },
  })),
}));

describe('ABTesting Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVariantForUser', () => {
    it('should return null for non-running tests', async () => {
      const test: ABTest = {
        id: 'test-1',
        name: 'Test A/B',
        description: 'Test description',
        campaign_id: 'campaign-1',
        status: 'draft',
        variants: [],
        target_metric: 'conversion_rate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock the getTest method
      jest.spyOn(abTesting, 'getTest').mockResolvedValue(test);

      const result = await abTesting.getVariantForUser('test-1', 'user-1');
      expect(result).toBeNull();
    });

    it('should assign users to variants based on consistent hashing', async () => {
      const variants: ABTestVariant[] = [
        {
          id: 'variant-1',
          name: 'Variant A',
          description: 'First variant',
          weight: 50,
          config: {},
          metrics: { impressions: 0, clicks: 0, conversions: 0, revenue: 0, custom_metrics: {} },
        },
        {
          id: 'variant-2',
          name: 'Variant B',
          description: 'Second variant',
          weight: 50,
          config: {},
          metrics: { impressions: 0, clicks: 0, conversions: 0, revenue: 0, custom_metrics: {} },
        },
      ];

      const test: ABTest = {
        id: 'test-1',
        name: 'Test A/B',
        description: 'Test description',
        campaign_id: 'campaign-1',
        status: 'running',
        variants,
        target_metric: 'conversion_rate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      jest.spyOn(abTesting, 'getTest').mockResolvedValue(test);

      // Test consistent assignment
      const result1 = await abTesting.getVariantForUser('test-1', 'user-1');
      const result2 = await abTesting.getVariantForUser('test-1', 'user-1');
      expect(result1?.id).toBe(result2?.id);
    });
  });

  describe('trackEvent', () => {
    it('should track events successfully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const success = await abTesting.trackEvent('test-1', 'variant-1', 'user-1', 'click');
      expect(success).toBe(true);
    });

    it('should handle tracking errors', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => Promise.resolve({ error: new Error('DB Error') })),
        })),
      };

      jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockSupabase as any);

      const success = await abTesting.trackEvent('test-1', 'variant-1', 'user-1', 'click');
      expect(success).toBe(false);
    });
  });

  describe('calculateTestStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockResults = [
        { variant_id: 'variant-1', action: 'impression', value: null },
        { variant_id: 'variant-1', action: 'click', value: null },
        { variant_id: 'variant-1', action: 'conversion', value: 50 },
        { variant_id: 'variant-2', action: 'impression', value: null },
        { variant_id: 'variant-2', action: 'click', value: null },
      ];

      jest.spyOn(abTesting, 'getTestResults').mockResolvedValue(mockResults);

      const test: ABTest = {
        id: 'test-1',
        name: 'Test A/B',
        description: 'Test description',
        campaign_id: 'campaign-1',
        status: 'running',
        variants: [
          {
            id: 'variant-1',
            name: 'Variant A',
            description: 'First variant',
            weight: 50,
            config: {},
            metrics: { impressions: 0, clicks: 0, conversions: 0, revenue: 0, custom_metrics: {} },
          },
          {
            id: 'variant-2',
            name: 'Variant B',
            description: 'Second variant',
            weight: 50,
            config: {},
            metrics: { impressions: 0, clicks: 0, conversions: 0, revenue: 0, custom_metrics: {} },
          },
        ],
        target_metric: 'conversion_rate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      jest.spyOn(abTesting, 'getTest').mockResolvedValue(test);

      const statistics = await abTesting.calculateTestStatistics('test-1');

      expect(statistics).toHaveProperty('variant-1');
      expect(statistics['variant-1']).toHaveProperty('impressions', 1);
      expect(statistics['variant-1']).toHaveProperty('clicks', 1);
      expect(statistics['variant-1']).toHaveProperty('conversions', 1);
      expect(statistics['variant-1']).toHaveProperty('revenue', 50);
      expect(statistics['variant-1']).toHaveProperty('click_through_rate');
      expect(statistics['variant-1']).toHaveProperty('conversion_rate');
    });
  });

  describe('determineWinner', () => {
    it('should determine winner based on conversion rate', async () => {
      const mockStatistics = {
        'variant-1': {
          impressions: 100,
          clicks: 10,
          conversions: 5,
          revenue: 250,
          click_through_rate: 10,
          conversion_rate: 50,
          average_order_value: 50,
        },
        'variant-2': {
          impressions: 100,
          clicks: 8,
          conversions: 2,
          revenue: 100,
          click_through_rate: 8,
          conversion_rate: 25,
          average_order_value: 50,
        },
      };

      jest.spyOn(abTesting, 'calculateTestStatistics').mockResolvedValue(mockStatistics);

      const winner = await abTesting.determineWinner('test-1');
      expect(winner).toBe('variant-1');
    });
  });
});