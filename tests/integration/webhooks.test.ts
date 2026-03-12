import { POST as jazzPOST } from '@/app/api/webhooks/jazzcash/return/route';
import { POST as easypaisaPOST } from '@/app/api/webhooks/easypaisa/return/route';
import { createClient } from '@/lib/supabase/server';
import { jazzCashClient } from '@/lib/payments/jazzcash/client';
import { easyPaisaClient } from '@/lib/payments/easypaisa/client';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/payments/jazzcash/client');
jest.mock('@/lib/payments/easypaisa/client');

const mockedCreateClient = createClient as unknown as jest.Mock;
const mockedJazz = jazzCashClient as unknown as jest.Mocked<typeof jazzCashClient>;
const mockedEasy = easyPaisaClient as unknown as jest.Mocked<typeof easyPaisaClient>;

function makeSupabaseForWebhooks() {
  const chainable = () => {
    const obj: any = {
      eq: (_k: any, _v: any) => obj,
      then: (resolve: any) => resolve({ error: null }),
    };
    return obj;
  };

  return {
    from: (table: string) => {
      if (table === 'orders' || table === 'tickets' || table === 'payment_intents') {
        return { update: () => chainable() };
      }
      if (table === 'webhook_logs') {
        return { insert: async () => ({ data: null, error: null }) };
      }
      return { insert: async () => ({ data: null, error: null }) };
    },
  };
}

function makeRequestWithForm(form: Record<string, string>) {
  return {
    formData: async () => {
      return {
        forEach(cb: (value: string, key: string) => void) {
          Object.entries(form).forEach(([k, v]) => cb(v, k));
        },
      } as any;
    },
    url: 'http://localhost/api/webhooks',
  } as any;
}

describe('Webhook handlers', () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
    mockedJazz.verifyWebhook.mockReset();
    mockedJazz.getPaymentStatus.mockReset();
    mockedEasy.verifyWebhook.mockReset();
    mockedEasy.getPaymentStatus.mockReset();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';
  });

  it('processes JazzCash successful webhook and redirects to success', async () => {
    const orderId = 'order-jz-1';
    const supabase = makeSupabaseForWebhooks();
    mockedCreateClient.mockReturnValue(supabase as any);

    mockedJazz.verifyWebhook.mockReturnValue(true);
    mockedJazz.getPaymentStatus.mockReturnValue({ status: 'success', message: 'OK' });

    const req = makeRequestWithForm({ pp_TxnRefNo: orderId, pp_ResponseCode: '000', pp_ResponseMessage: 'Approved' });

    const res: any = await jazzPOST(req as any);

    // Expect redirect to success page
    expect(res.status).toBeDefined();
    // NextResponse.redirect returns a Response-like object with 'headers' containing location
    const location = res.headers?.get ? res.headers.get('location') : res.headers?.location;
    expect(location).toBeTruthy();
    expect(location).toContain('/payment/success');
  });

  it('processes EasyPaisa failed webhook and redirects to failed', async () => {
    const orderId = 'order-ep-1';
    const supabase = makeSupabaseForWebhooks();
    mockedCreateClient.mockReturnValue(supabase as any);

    mockedEasy.verifyWebhook.mockReturnValue(true);
    mockedEasy.getPaymentStatus.mockReturnValue({ status: 'failed', message: 'Declined' });

    const req = makeRequestWithForm({ ORDER_ID: orderId, TRANSACTION_ID: 'txn-1', AMOUNT: '1000' });

    const res: any = await easypaisaPOST(req as any);

    const location = res.headers?.get ? res.headers.get('location') : res.headers?.location;
    expect(location).toBeTruthy();
    expect(location).toContain('/payment/failed');
  });
});
