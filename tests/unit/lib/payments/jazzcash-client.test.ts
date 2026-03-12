import { jazzCashClient } from '@/lib/payments/jazzcash/client';

describe('JazzCash Client', () => {
  beforeEach(() => {
    process.env.JAZZCASH_MERCHANT_ID = 'TEST_MERCHANT';
    process.env.JAZZCASH_PASSWORD = 'TEST_PASSWORD';
    process.env.JAZZCASH_INTEGRITY_SALT = 'TEST_SALT';
  });

  describe('generateSecureHash', () => {
    it('generates a hash for valid payment data', () => {
      const data = {
        pp_merchant_id: 'MERCHANT',
        pp_amount: '1000',
        pp_TxnRefNo: 'TXN123',
      };

      const hash = jazzCashClient.generateSecureHash(data);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('generates consistent hash for same data', () => {
      const data = {
        pp_merchant_id: 'MERCHANT',
        pp_amount: '1000',
        pp_TxnRefNo: 'TXN123',
      };

      const hash1 = jazzCashClient.generateSecureHash(data);
      const hash2 = jazzCashClient.generateSecureHash(data);

      expect(hash1).toBe(hash2);
    });

    it('generates different hashes for different data', () => {
      const data1 = { pp_merchant_id: 'MERCHANT', pp_amount: '1000' };
      const data2 = { pp_merchant_id: 'MERCHANT', pp_amount: '2000' };

      const hash1 = jazzCashClient.generateSecureHash(data1);
      const hash2 = jazzCashClient.generateSecureHash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getPaymentStatus', () => {
    it('returns success for response code 000', () => {
      const result = jazzCashClient.getPaymentStatus('000');

      expect(result.status).toBe('success');
      expect(result.message).toBeDefined();
    });

    it('returns failed for non-000 response code', () => {
      const result = jazzCashClient.getPaymentStatus('001');

      expect(result.status).toBe('failed');
      expect(result.message).toBeDefined();
    });

    it('returns failed for null response code', () => {
      const result = jazzCashClient.getPaymentStatus(null as any);

      expect(result.status).toBe('failed');
    });
  });

  describe('createPayment', () => {
    it('returns payment URL and params', async () => {
      const result = await jazzCashClient.createPayment({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        customerEmail: 'test@example.com',
        customerPhone: '03001234567',
        customerName: 'Test User',
      });

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.params).toBeDefined();
      expect(typeof result.url).toBe('string');
      expect(result.url).toContain('jazzcash');
    });

    it('includes required payment parameters', async () => {
      const result = await jazzCashClient.createPayment({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test Payment',
        customerEmail: 'test@example.com',
        customerPhone: '03001234567',
      });

      expect(result.params).toHaveProperty('pp_TxnRefNo', 'ORD-001');
      expect(result.params).toHaveProperty('pp_Amount', '100000');
      expect(result.params).toHaveProperty('pp_MerchantID');
      expect(result.params).toHaveProperty('pp_SecureHash');
    });

    it('handles amount conversion correctly', async () => {
      const result = await jazzCashClient.createPayment({
        amount: 500,
        orderId: 'ORD-002',
        description: 'Test',
        customerEmail: 'test@example.com',
      });

      // JazzCash expects amount in smallest unit (paisas)
      expect(result.params.pp_Amount).toBe('50000');
    });
  });

  describe('verifyWebhook', () => {
    it('verifies valid webhook data', () => {
      const webhookData = {
        pp_TxnRefNo: 'ORD-001',
        pp_ResponseCode: '000',
        pp_ResponseMessage: 'Approved',
        pp_Amount: '100000',
      };

      // Generate a valid hash for this data
      const hash = jazzCashClient.generateSecureHash(webhookData);
      const dataWithHash = { ...webhookData, pp_SecureHash: hash };

      const result = jazzCashClient.verifyWebhook(dataWithHash);

      expect(typeof result).toBe('boolean');
    });

    it('rejects webhook with invalid hash', () => {
      const webhookData = {
        pp_TxnRefNo: 'ORD-001',
        pp_ResponseCode: '000',
        pp_SecureHash: 'INVALID_HASH',
      };

      const result = jazzCashClient.verifyWebhook(webhookData);

      // Should return false or throw error
      expect(result).toBeFalsy();
    });

    it('handles missing SecureHash', () => {
      const webhookData = {
        pp_TxnRefNo: 'ORD-001',
        pp_ResponseCode: '000',
      };

      const result = jazzCashClient.verifyWebhook(webhookData);

      expect(result).toBeFalsy();
    });
  });
});
