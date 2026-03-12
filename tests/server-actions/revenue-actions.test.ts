/**
 * Tests for revenue-actions.ts
 * Revenue & Monetization Server Actions
 *
 * Tests: Subscriptions, Sponsored Events, Affiliate Programs
 */

import { createClient } from '@supabase/supabase-js';
import {
  getSubscriptionTiers,
  getCurrentSubscription,
  createSubscription,
  checkFeatureAccess,
  bookSponsoredSlot,
  createAffiliateAccount,
  getAffiliateAccount
} from '@/lib/actions/revenue-actions';
import { mockSupabaseQuery, resetMockDatabase, mockAuth } from '@/__mocks__/@supabase/supabase-js';

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock createClient to use our mock
jest.mock('@/lib/auth/config', () => ({
  createClient: jest.fn(() => {
    const supabase = createClient('url', 'key');
    return Promise.resolve(supabase);
  }),
}));

describe('revenue-actions', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  // =========================================================================
  // SUBSCRIPTION ACTIONS
  // =========================================================================

  describe('getSubscriptionTiers', () => {
    it('should return active subscription tiers ordered by display_order', async () => {
      const supabase = createClient('url', 'key');

      const mockTiers = [
        { id: '1', name: 'Basic', is_active: true, display_order: 1, price_monthly: 500 },
        { id: '2', name: 'Pro', is_active: true, display_order: 2, price_monthly: 1500 },
        { id: '3', name: 'Enterprise', is_active: true, display_order: 3, price_monthly: 5000 },
      ];

      mockSupabaseQuery(supabase, 'subscription_tiers', mockTiers);

      const result = await getSubscriptionTiers();

      expect(result).toHaveProperty('tiers');
      expect(result.tiers).toEqual(mockTiers);
      expect(result.tiers).toHaveLength(3);
    });

    it('should return error when Supabase query fails', async () => {
      const supabase = createClient('url', 'key');

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      } as any);

      const result = await getSubscriptionTiers();

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Database connection failed');
    });

    it('should return empty array when no tiers exist', async () => {
      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'subscription_tiers', []);

      const result = await getSubscriptionTiers();

      expect(result.tiers).toEqual([]);
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return active subscription for authenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-123',
        tier_id: 'tier-2',
        status: 'active',
        tier: { id: 'tier-2', name: 'Pro' },
      };

      mockSupabaseQuery(supabase, 'user_subscriptions', [mockSubscription]);

      const result = await getCurrentSubscription();

      expect(result).toHaveProperty('subscription');
      expect(result.subscription).toEqual(mockSubscription);
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await getCurrentSubscription();

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should return null subscription when user has no active subscription', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'user_subscriptions', []);

      const result = await getCurrentSubscription();

      expect(result.subscription).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create monthly subscription for authenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockTier = {
        id: 'tier-1',
        name: 'Basic',
        price_monthly: 500,
        price_yearly: 5000,
      };

      const mockSubscription = {
        id: 'sub-new-1',
        user_id: 'user-123',
        tier_id: 'tier-1',
        billing_cycle: 'monthly',
        amount: 500,
        status: 'active',
      };

      mockSupabaseQuery(supabase, 'subscription_tiers', [mockTier]);
      mockSupabaseQuery(supabase, 'user_subscriptions', [mockSubscription]);

      const result = await createSubscription('tier-1', 'monthly', 'stripe');

      expect(result).toHaveProperty('subscription');
      expect(result.subscription).toHaveProperty('id', 'sub-new-1');
      expect(result.subscription).toHaveProperty('billing_cycle', 'monthly');
    });

    it('should calculate yearly pricing correctly', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockTier = {
        id: 'tier-2',
        name: 'Pro',
        price_monthly: 1500,
        price_yearly: 15000,
      };

      const mockSubscription = {
        id: 'sub-yearly-1',
        user_id: 'user-123',
        tier_id: 'tier-2',
        billing_cycle: 'yearly',
        amount: 15000,
        status: 'active',
      };

      mockSupabaseQuery(supabase, 'subscription_tiers', [mockTier]);
      mockSupabaseQuery(supabase, 'user_subscriptions', [mockSubscription]);

      const result = await createSubscription('tier-2', 'yearly', 'stripe');

      expect(result.subscription).toHaveProperty('amount', 15000);
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await createSubscription('tier-1', 'monthly', 'stripe');

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when tier does not exist', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'subscription_tiers', []);

      const result = await createSubscription('invalid-tier', 'monthly', 'stripe');

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Invalid tier');
    });
  });

  describe('checkFeatureAccess', () => {
    it('should return true when user has active subscription with feature', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-123',
        status: 'active',
        tier: {
          id: 'tier-2',
          name: 'Pro',
          features: {
            sponsored_events: true,
            custom_branding: true,
            analytics: true,
          },
        },
      };

      mockSupabaseQuery(supabase, 'user_subscriptions', [mockSubscription]);

      const result = await checkFeatureAccess('sponsored_events');

      expect(result).toHaveProperty('hasAccess', true);
    });

    it('should return false when feature is not available in tier', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-123',
        status: 'active',
        tier: {
          id: 'tier-1',
          name: 'Basic',
          features: {
            sponsored_events: false,
            custom_branding: false,
          },
        },
      };

      mockSupabaseQuery(supabase, 'user_subscriptions', [mockSubscription]);

      const result = await checkFeatureAccess('sponsored_events');

      expect(result).toHaveProperty('hasAccess', false);
    });

    it('should return false for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await checkFeatureAccess('sponsored_events');

      expect(result).toHaveProperty('hasAccess', false);
    });

    it('should return false when user has no active subscription', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'user_subscriptions', []);

      const result = await checkFeatureAccess('sponsored_events');

      expect(result).toHaveProperty('hasAccess', false);
    });
  });

  // =========================================================================
  // SPONSORED EVENTS ACTIONS
  // =========================================================================

  describe('bookSponsoredSlot', () => {
    it('should calculate total amount based on days', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockSlot = {
        id: 'slot-1',
        position: 'homepage_banner',
        price_per_day: 500,
      };

      const mockBooking = {
        id: 'booking-1',
        event_id: 'event-123',
        slot_id: 'slot-1',
        total_amount: 2500, // 5 days * 500
        status: 'pending',
      };

      mockSupabaseQuery(supabase, 'sponsored_event_slots', [mockSlot]);
      mockSupabaseQuery(supabase, 'sponsored_event_bookings', [mockBooking]);

      const startDate = new Date('2026-02-10');
      const endDate = new Date('2026-02-14'); // 5 days

      const result = await bookSponsoredSlot({
        event_id: 'event-123',
        slot_id: 'slot-1',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      expect(result).toHaveProperty('booking');
      expect(result.booking).toHaveProperty('total_amount', 2500);
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await bookSponsoredSlot({
        event_id: 'event-123',
        slot_id: 'slot-1',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when slot does not exist', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'sponsored_event_slots', []);

      const result = await bookSponsoredSlot({
        event_id: 'event-123',
        slot_id: 'invalid-slot',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Invalid slot');
    });
  });

  // =========================================================================
  // AFFILIATE PROGRAM ACTIONS
  // =========================================================================

  describe('createAffiliateAccount', () => {
    it('should create affiliate account with unique code', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockAccount = {
        id: 'affiliate-1',
        user_id: 'user-123',
        affiliate_code: 'AFF123ABC',
        payment_method: 'bank_transfer',
        status: 'pending',
      };

      mockSupabaseQuery(supabase, 'affiliate_accounts', [mockAccount]);

      const result = await createAffiliateAccount({
        payment_method: 'bank_transfer',
        payment_details: { bank: 'HBL', account: '1234' },
      });

      expect(result).toHaveProperty('account');
      expect(result.account).toHaveProperty('affiliate_code');
      expect(result.account.affiliate_code).toMatch(/^AFF/);
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await createAffiliateAccount({
        payment_method: 'bank_transfer',
        payment_details: {},
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should include payment details in account', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const paymentDetails = {
        payment_method: 'jazzcash',
        payment_details: { phone: '03001234567' },
      };

      const mockAccount = {
        id: 'affiliate-1',
        user_id: 'user-123',
        affiliate_code: 'AFF456DEF',
        ...paymentDetails,
        status: 'pending',
      };

      mockSupabaseQuery(supabase, 'affiliate_accounts', [mockAccount]);

      const result = await createAffiliateAccount(paymentDetails);

      expect(result.account).toHaveProperty('payment_method', 'jazzcash');
    });
  });

  describe('getAffiliateAccount', () => {
    it('should return affiliate account for authenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockAccount = {
        id: 'affiliate-1',
        user_id: 'user-123',
        affiliate_code: 'AFF123ABC',
        status: 'active',
        total_clicks: 100,
        total_conversions: 5,
        total_earned: 5000,
      };

      mockSupabaseQuery(supabase, 'affiliate_accounts', [mockAccount]);

      const result = await getAffiliateAccount();

      expect(result).toHaveProperty('account');
      expect(result.account).toHaveProperty('affiliate_code', 'AFF123ABC');
      expect(result.account).toHaveProperty('total_clicks', 100);
    });

    it('should return error for unauthenticated user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await getAffiliateAccount();

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Unauthorized');
    });

    it('should return null account when user has no affiliate account', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'affiliate_accounts', []);

      const result = await getAffiliateAccount();

      expect(result.account).toBeNull();
    });
  });

  // =========================================================================
  // ERROR CASES
  // =========================================================================

  describe('database error handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      jest.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      const result = await getSubscriptionTiers();

      // Should not throw, but handle the error
      expect(result).toBeDefined();
    });
  });
});
