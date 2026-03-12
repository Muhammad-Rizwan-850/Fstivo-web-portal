import { POST } from '@/app/api/tickets/purchase/route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

const mockedCreateClient = createClient as unknown as jest.Mock;

function makeSupabaseMock(overrides: any = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: overrides.user || null }, error: null }),
    },
    from: (table: string) => {
      if (table === 'ticket_tiers') {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: overrides.tier || null, error: null }) }) }),
        };
      }
      if (table === 'events') {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: overrides.event || null, error: null }) }) }),
        };
      }
      if (table === 'orders') {
        return {
          insert: () => ({ select: () => ({ single: async () => ({ data: overrides.order || null, error: null }) }) }),
        };
      }
      if (table === 'tickets') {
        return {
          insert: async () => ({ data: null, error: null }),
        };
      }
      return { select: () => ({ single: async () => ({ data: null, error: null }) }) };
    },
  };
}

describe('POST /api/tickets/purchase edge cases', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  it('returns 400 when tier not found', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseMock({ user: { id: 'user-x' }, tier: null, event: null }));

    const req: any = { json: async () => ({ tier_id: '11111111-1111-1111-1111-111111111111', quantity: 1 }) };

    const res: any = await POST(req as any);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('returns 400 when event is inactive', async () => {
    const tier = {
      id: '11111111-1111-1111-1111-111111111111', price: 500, is_available: true, tickets_available: 5, tickets_sold: 0,
      event: { id: '22222222-2222-2222-2222-222222222222' },
    };
    const event = { id: '22222222-2222-2222-2222-222222222222', status: 'cancelled' };

    mockedCreateClient.mockReturnValue(makeSupabaseMock({ user: { id: 'user-x' }, tier, event }));

    const req: any = { json: async () => ({ tier_id: tier.id, quantity: 1 }) };

    const res: any = await POST(req as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/event/i);
  });

  it('returns 400 when not enough tickets available', async () => {
    const tier = {
      id: '33333333-3333-3333-3333-333333333333', price: 800, is_available: true, tickets_available: 2, tickets_sold: 2,
      event: { id: '44444444-4444-4444-4444-444444444444' },
    };
    const event = { id: '44444444-4444-4444-4444-444444444444', status: 'active' };

    mockedCreateClient.mockReturnValue(makeSupabaseMock({ user: { id: 'user-x' }, tier, event }));

    const req: any = { json: async () => ({ tier_id: tier.id, quantity: 1 }) };

    const res: any = await POST(req as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/available/i);
  });
});
