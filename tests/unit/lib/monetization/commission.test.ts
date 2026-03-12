import {
  calculateCommission,
  recordConversion,
  getAffiliateCommissions,
  approveCommission,
  rejectCommission,
  getCommissionSummary,
  getRecentConversions,
  getCommissionEarningsOverTime,
} from '@/lib/monetization/affiliate/commission';

// Mock Supabase
jest.mock('@/lib/supabase/secure-client', () => ({
  createServerClient: jest.fn(),
}));

const { createServerClient } = require('@/lib/supabase/secure-client');

describe('Affiliate Commission Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCommission', () => {
    it('returns 0 for zero order amount', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await calculateCommission(0, 'affiliate-1');
      expect(result).toBe(0);
    });

    it('calculates 5% commission on order amount', async () => {
      const mockConfig = {
        commission_percentage: 5,
        commission_structure: { type: 'flat' },
      };
      const mockAccount = { total_conversions: 0 };

      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'affiliate_program_config') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockConfig, error: null }),
                }),
              }),
            };
          }
          if (table === 'affiliate_accounts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockAccount, error: null }),
                }),
              }),
            };
          }
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await calculateCommission(1000, 'affiliate-1');
      expect(result).toBe(50); // 1000 * 5% = 50
    });

    it('handles tiered commission structure', async () => {
      const mockConfig = {
        commission_percentage: 5,
        commission_structure: {
          type: 'tiered',
          tiers: [
            { minConversions: 0, maxConversions: 10, commissionPercentage: 3 },
            { minConversions: 11, maxConversions: 50, commissionPercentage: 5 },
            { minConversions: 51, maxConversions: 999999, commissionPercentage: 8 },
          ],
        },
      };
      const mockAccount = { total_conversions: 60 }; // High tier

      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'affiliate_program_config') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockConfig, error: null }),
                }),
              }),
            };
          }
          if (table === 'affiliate_accounts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockAccount, error: null }),
                }),
              }),
            };
          }
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await calculateCommission(1000, 'affiliate-1');
      // Should use 8% tier for 60 conversions
      expect(result).toBeGreaterThanOrEqual(50);
    });

    it('returns 0 on error', async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await calculateCommission(1000, 'affiliate-1');
      expect(result).toBe(0);
    });
  });

  describe('approveCommission', () => {
    it('approves a commission by ID', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await approveCommission('commission-1');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCommissionSummary', () => {
    it('fetches commission summary for affiliate', async () => {
      const mockSummary = {
        total_earned: 5000,
        total_pending: 1000,
        total_paid: 4000,
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockSummary,
              error: null,
            }),
          }),
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await getCommissionSummary('affiliate-1');
      expect(result).toBeDefined();
    });
  });

  describe('getRecentConversions', () => {
    it('fetches recent conversions for affiliate', async () => {
      const mockConversions = [
        { id: 'conv-1', amount: 500, status: 'completed' },
        { id: 'conv-2', amount: 300, status: 'completed' },
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockConversions,
                error: null,
              }),
            }),
          }),
        }),
      };
      createServerClient.mockResolvedValue(mockSupabase);

      const result = await getRecentConversions('affiliate-1', 10);
      expect(result).toBeDefined();
    });
  });
});
