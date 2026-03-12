import { initiatePayment } from '@/lib/payments';
import { jazzCashClient } from '@/lib/payments/jazzcash/client';
import { easyPaisaClient } from '@/lib/payments/easypaisa/client';

jest.mock('@/lib/payments/jazzcash/client');
jest.mock('@/lib/payments/easypaisa/client');
jest.mock('@/lib/payments/stripe/client');

const mockedJazzCash = jazzCashClient as unknown as jest.Mocked<typeof jazzCashClient>;
const mockedEasyPaisa = easyPaisaClient as unknown as jest.Mocked<typeof easyPaisaClient>;

describe('initiatePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JazzCash provider', () => {
    it('initiates payment with JazzCash client', async () => {
      mockedJazzCash.createPayment.mockResolvedValue({
        url: 'https://jazzcash.test/checkout',
        params: { pp_TxnRefNo: 'ORD-001', pp_Amount: '100000' },
      });

      const result = await initiatePayment('jazzcash', {
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        email: 'test@example.com',
        phone: '03001234567',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url');
      expect(mockedJazzCash.createPayment).toHaveBeenCalledWith({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        customerEmail: 'test@example.com',
        customerPhone: '03001234567',
      });
    });

    it('returns success false if JazzCash createPayment fails', async () => {
      mockedJazzCash.createPayment.mockRejectedValue(new Error('JazzCash Error'));

      const promise = initiatePayment('jazzcash', {
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
      });

      await expect(promise).rejects.toThrow('JazzCash Error');
    });
  });

  describe('EasyPaisa provider', () => {
    it('initiates payment with EasyPaisa client', async () => {
      mockedEasyPaisa.createPayment.mockResolvedValue({
        url: 'https://easypaisa.test/checkout',
        params: { ORDER_ID: 'ORD-001', AMOUNT: '1000.00' },
      });

      const result = await initiatePayment('easypaisa', {
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        email: 'test@example.com',
        phone: '03001234567',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url');
      expect(mockedEasyPaisa.createPayment).toHaveBeenCalledWith({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        customerEmail: 'test@example.com',
        customerPhone: '03001234567',
      });
    });

    it('provides empty strings for missing email/phone', async () => {
      mockedEasyPaisa.createPayment.mockResolvedValue({
        url: 'https://easypaisa.test',
        params: {},
      });

      await initiatePayment('easypaisa', {
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
      });

      expect(mockedEasyPaisa.createPayment).toHaveBeenCalledWith({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        customerEmail: '',
        customerPhone: '',
      });
    });
  });

  describe('Invalid provider', () => {
    it('returns error for invalid provider', async () => {
      const result = await initiatePayment('invalid' as any, {
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid payment provider/);
    });
  });
});
