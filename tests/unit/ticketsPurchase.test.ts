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

describe('POST /api/tickets/purchase', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  it('returns 400 for invalid payload', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseMock());

    const req: any = {
      json: async () => ({ tier_id: 'not-a-uuid', quantity: 0 }),
    };

    const res: any = await POST(req as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 401 when unauthenticated', async () => {
    mockedCreateClient.mockReturnValue(makeSupabaseMock({ user: null }));

    const req: any = {
      json: async () => ({ tier_id: '11111111-1111-1111-1111-111111111111', quantity: 1 }),
    };

    const res: any = await POST(req as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it('creates an order when tier and event exist and tickets available', async () => {
    const tier = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'VIP',
      price: 1000,
      is_available: true,
      tickets_available: 10,
      tickets_sold: 0,
      event: { id: '22222222-2222-2222-2222-222222222222', title: 'Test Event' },
    };

    const event = { id: tier.event.id, title: 'Test Event', status: 'active' };

    const order = {
      id: '33333333-3333-3333-3333-333333333333',
      event_id: event.id,
      tier_id: tier.id,
      quantity: 1,
      total_amount: 1000,
      currency: 'PKR',
      status: 'pending',
      payment_status: 'pending',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
    };

    mockedCreateClient.mockReturnValue(makeSupabaseMock({ user: { id: 'user-123' }, tier, event, order }));

    const req: any = {
      json: async () => ({ tier_id: tier.id, quantity: 1 }),
    };

    const res: any = await POST(req as any);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.order).toBeDefined();
    expect(body.order.id).toBe(order.id);
  });
});
