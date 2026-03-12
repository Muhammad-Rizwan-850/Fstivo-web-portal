// Integration test skeleton for payment flow
// This file provides a starting point for integration tests that exercise
// the payment endpoints and payment client interactions. Use Supabase mocks
// and provider client mocks to simulate success/failure.

import { POST as createEasypaisa } from '@/app/api/payments/easypaisa/create/route';
import { POST as createJazzcash } from '@/app/api/payments/jazzcash/create/route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/payments/easypaisa/client');
jest.mock('@/lib/payments/jazzcash/client');

const mockedCreateClient = createClient as unknown as jest.Mock;
const { easyPaisaClient } = jest.requireMock('@/lib/payments/easypaisa/client');
const { jazzCashClient } = jest.requireMock('@/lib/payments/jazzcash/client');

function makeChainable(insertResponse: any = { error: null }, singleResponse: any = { data: null, error: null }) {
  return {
    insert: jest.fn().mockResolvedValue(insertResponse),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(singleResponse),
    update: jest.fn().mockResolvedValue(insertResponse),
  };
}

function makeSupabaseMockForPayment({ user = { id: 'user-1' }, order = null }: any = {}) {
  const paymentIntentsChain = makeChainable({ error: null }, { data: null, error: null });
  const ordersChain = makeChainable({ error: null }, { data: order, error: null });

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: (table: string) => {
      if (table === 'orders') return ordersChain;
      if (table === 'payment_intents') return paymentIntentsChain;
      return makeChainable({ error: null }, { data: null, error: null });
    },
    __paymentIntents: paymentIntentsChain,
  };
}

describe('Payment creation endpoints (integration - mocked)', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
    easyPaisaClient.createPayment = jest.fn();
    jazzCashClient.createPayment = jest.fn();
  });

  it('returns 401 when user is not authenticated (EasyPaisa)', async () => {
    mockedCreateClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } });

    const req: any = { json: async () => ({ orderId: 'order-1', amount: 1000 }) };
    const res: any = await createEasypaisa(req as any);

    expect(res.status).toBe(401);
  });

  it('returns 401 when user is not authenticated (JazzCash)', async () => {
    mockedCreateClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } });

    const req: any = { json: async () => ({ orderId: 'order-1', amount: 1000 }) };
    const res: any = await createJazzcash(req as any);

    expect(res.status).toBe(401);
  });

  it('EasyPaisa: creates payment and returns payment object', async () => {
    const order = { id: 'order-123', user_id: 'user-1' };
    const sbMock = makeSupabaseMockForPayment({ user: { id: 'user-1' }, order });
    mockedCreateClient.mockReturnValue(sbMock);

    easyPaisaClient.createPayment.mockResolvedValue({
      url: 'https://easypaisa.test/checkout',
      params: { ORDER_ID: order.id, AMOUNT: '1000.00' },
      transactionId: 'txn-ep-1',
    });

    const req: any = { json: async () => ({ orderId: order.id, amount: 1000 }) };
    const res: any = await createEasypaisa(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.payment.url).toBe('https://easypaisa.test/checkout');
    // ensure payment_intent was stored
    expect(sbMock.__paymentIntents.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: order.id,
        provider: 'easypaisa',
        amount: 1000,
        currency: 'PKR',
        status: 'pending',
      })
    );
  });

  it('JazzCash: creates payment and returns payment object', async () => {
    const order = { id: 'order-456', user_id: 'user-1' };
    const sbMock = makeSupabaseMockForPayment({ user: { id: 'user-1' }, order });
    mockedCreateClient.mockReturnValue(sbMock);

    jazzCashClient.createPayment.mockResolvedValue({
      url: 'https://jazzcash.test/checkout',
      params: { pp_TxnRefNo: order.id, pp_Amount: '100000' },
    });

    const req: any = { json: async () => ({ orderId: order.id, amount: 1000 }) };
    const res: any = await createJazzcash(req as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.payment.url).toBe('https://jazzcash.test/checkout');
    // ensure payment_intent was stored
    expect(sbMock.__paymentIntents.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: order.id,
        provider: 'jazzcash',
        amount: 1000,
        currency: 'PKR',
        status: 'pending',
      })
    );
  });
});
