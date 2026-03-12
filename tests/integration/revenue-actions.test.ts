import { createSupabaseMock } from '@/lib/testing/supabaseMock';
import * as authConfig from '@/lib/auth/config';
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import {
  getSubscriptionTiers,
  createSubscription,
  checkFeatureAccess,
  bookSponsoredSlot,
  createBannerAd,
} from '@/lib/actions/revenue-actions';

jest.mock('@/lib/auth/config');

function makeChain(result: any) {
  const chain: any = {};
  const thenable = (res = result) => Promise.resolve(res);
  chain.select = () => chain;
  chain.insert = () => chain;
  chain.update = () => chain;
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.single = async () => ({ data: result, error: null });
  chain.maybeSingle = async () => ({ data: result, error: null });
  chain.then = (cb: any) => thenable({ data: result, error: null }).then(cb);
  return chain;
}

describe('revenue-actions integration (using supabase mock)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getSubscriptionTiers returns tiers', async () => {
    const tier = { id: 'tier1', name: 'Pro', is_active: true };
    const supabase = createSupabaseMock();

    supabase.from = (table: string) => {
      if (table === 'subscription_tiers') {
        return makeChain([tier]);
      }
      return makeChain(null);
    };

    (authConfig.createClient as jest.Mock).mockResolvedValue(supabase);

    const res = await getSubscriptionTiers();
    expect(res).toHaveProperty('tiers');
    expect((res as any).tiers[0].id).toBe('tier1');
  });

  it('createSubscription creates subscription and invoice', async () => {
    const supabase = createSupabaseMock();
    const user = { id: 'user-1' };
    const tier = { id: 't1', price_monthly: 10, price_yearly: 100 };

    supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });

    supabase.from = (table: string) => {
      if (table === 'subscription_tiers') return makeChain(tier);
      if (table === 'user_subscriptions') return makeChain({ id: 'sub-1', user_id: user.id, current_period_start: new Date().toISOString(), current_period_end: new Date().toISOString() });
      if (table === 'subscription_invoices' || table === 'subscription_history') return makeChain(null);
      return makeChain(null);
    };

    (authConfig.createClient as jest.Mock).mockResolvedValue(supabase);

    const res = await createSubscription('t1', 'monthly', 'card_1');
    expect(res).toHaveProperty('subscription');
    expect((res as any).subscription.id).toBe('sub-1');
  });

  it('checkFeatureAccess returns access correctly', async () => {
    const supabase = createSupabaseMock();
    const user = { id: 'user-1' };
    const subscription = { tier: { features: { 'premium-download': true } } };

    supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });
    supabase.from = (table: string) => {
      if (table === 'user_subscriptions') return makeChain(subscription);
      return makeChain(null);
    };

    (authConfig.createClient as jest.Mock).mockResolvedValue(supabase);

    const res = await checkFeatureAccess('premium-download');
    expect(res).toEqual({ hasAccess: true });
  });

  it('bookSponsoredSlot creates booking', async () => {
    const supabase = createSupabaseMock();
    const user = { id: 'u-1' };
    const slot = { id: 'slot-1', price_per_day: 50 };

    supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });

    supabase.from = (table: string) => {
      if (table === 'sponsored_event_slots') return makeChain(slot);
      if (table === 'sponsored_event_bookings') return makeChain({ id: 'booking-1' });
      return makeChain(null);
    };

    (authConfig.createClient as jest.Mock).mockResolvedValue(supabase);

    const res = await bookSponsoredSlot({ event_id: 'e1', slot_id: 'slot-1', start_date: '2025-01-01', end_date: '2025-01-03' });
    expect(res).toHaveProperty('booking');
    expect((res as any).booking.id).toBe('booking-1');
  });

  it('createBannerAd creates ad', async () => {
    const supabase = createSupabaseMock();
    const user = { id: 'u-1' };

    supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });

    supabase.from = (table: string) => {
      if (table === 'banner_ads') return makeChain({ id: 'ad-1' });
      return makeChain(null);
    };

    (authConfig.createClient as jest.Mock).mockResolvedValue(supabase);

    const payload = {
      title: 'Ad',
      image_url: 'https://example.com/img.png',
      destination_url: 'https://example.com',
      placement: 'home',
      budget_type: 'fixed',
      budget_amount: 100,
      start_date: '2025-01-01'
    } as any;

    const res = await createBannerAd(payload);
    expect(res).toHaveProperty('ad');
    expect((res as any).ad.id).toBe('ad-1');
  });
});
