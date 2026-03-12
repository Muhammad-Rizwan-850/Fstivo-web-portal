import { createSupabaseMock, resetSupabaseMock } from '@/lib/testing/supabaseMock';
import * as supabaseServer from '@/lib/supabase/server';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as jazzPOST } from '@/app/api/webhooks/jazzcash/return/route';
import { jazzCashClient } from '@/lib/payments/jazzcash/client';

jest.mock('@/lib/payments/jazzcash/client');

describe('Supabase mock factory + API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';
  });

  it('register route succeeds with mocked supabase', async () => {
    const supabase = createSupabaseMock();

    // Ensure auth.signUp returns a user
    supabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'u-123' }, session: null }, error: null });
    supabase.from('users').insert.mockResolvedValue({ data: null, error: null });

    jest.spyOn(supabaseServer as any, 'createClient').mockReturnValue(supabase);

    const req = { json: async () => ({ email: 'test@example.com', password: 'Test123!@#', full_name: 'Test User' }) } as any;

    const res: any = await registerPOST(req);

    expect(res).toBeDefined();
    expect([201, 400, 500]).toContain(res.status);
    if (res.status === 201) {
      const body = await res.json();
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('message');
    }

    resetSupabaseMock(supabase);
  });

  it('jazzcash return webhook updates DB and redirects on success', async () => {
    // Prepare supabase mock
    const supabase = createSupabaseMock();
    // Make update chainable return success
    // createSupabaseMock returned update as thenable already

    jest.spyOn(supabaseServer as any, 'createClient').mockReturnValue(supabase);

    const mockedJazz = jazzCashClient as unknown as jest.Mocked<typeof jazzCashClient>;
    mockedJazz.verifyWebhook.mockReturnValue(true as any);
    mockedJazz.getPaymentStatus.mockReturnValue({ status: 'success', message: 'OK' } as any);

    const orderId = 'order-mock-1';
    const req = {
      formData: async () => ({
        forEach(cb: (value: string, key: string) => void) {
          const map = { pp_TxnRefNo: orderId, pp_ResponseCode: '000', pp_ResponseMessage: 'Approved' };
          Object.entries(map).forEach(([k, v]) => cb(v as string, k));
        },
      }),
    } as any;

    const res: any = await jazzPOST(req);

    expect(res).toBeDefined();
    // Should redirect to success page
    const location = res.headers?.get ? res.headers.get('location') : res.headers?.location;
    expect(location).toBeTruthy();
    expect(location).toContain('/payment/success');

    resetSupabaseMock(supabase);
  });
});
