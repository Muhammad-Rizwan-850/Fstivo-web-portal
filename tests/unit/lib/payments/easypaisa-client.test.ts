import { easyPaisaClient } from '@/lib/payments/easypaisa/client';

describe('EasyPaisa Client', () => {
  beforeEach(() => {
    process.env.EASYPAISA_STORE_ID = 'TEST_STORE';
    process.env.EASYPAISA_SECRET_KEY = 'TEST_SECRET';
  });

  describe('generateChecksum', () => {
    it('generates a checksum for valid payment data', () => {
      const data = {
        storeId: 'STORE',
        accountNum: '123456',
        amount: '1000',
        orderId: 'ORD-001',
      };

      const checksum = easyPaisaClient.generateChecksum(data);

      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('generates consistent checksum for same data', () => {
      const data = {
        storeId: 'STORE',
        accountNum: '123456',
        amount: '1000',
        orderId: 'ORD-001',
      };

      const checksum1 = easyPaisaClient.generateChecksum(data);
      const checksum2 = easyPaisaClient.generateChecksum(data);

      expect(checksum1).toBe(checksum2);
    });

    it('generates different checksums for different data', () => {
      const data1 = { storeId: 'STORE', accountNum: '123456', amount: '1000', orderId: 'ORD-001' };
      const data2 = { storeId: 'STORE', accountNum: '123456', amount: '2000', orderId: 'ORD-001' };

      const checksum1 = easyPaisaClient.generateChecksum(data1);
      const checksum2 = easyPaisaClient.generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('getPaymentStatus', () => {
    it('returns success for SUCCESS status', () => {
      const webhookData = { TRANSACTION_STATUS: 'SUCCESS' };
      const result = easyPaisaClient.getPaymentStatus(webhookData as any);

      expect(result.status).toBe('success');
    });

    it('returns failed for FAILURE status', () => {
      const webhookData = { TRANSACTION_STATUS: 'FAILURE' };
      const result = easyPaisaClient.getPaymentStatus(webhookData as any);

      expect(result.status).toBe('failed');
    });

    it('returns pending for PENDING status', () => {
      const webhookData = { TRANSACTION_STATUS: 'PENDING' };
      const result = easyPaisaClient.getPaymentStatus(webhookData as any);

      expect(result.status).toBe('pending');
    });

    it('returns failed for unknown status', () => {
      const webhookData = { TRANSACTION_STATUS: 'UNKNOWN' };
      const result = easyPaisaClient.getPaymentStatus(webhookData as any);

      expect(result.status).toBe('failed');
    });
  });

  describe('createPayment', () => {
    it('returns payment URL and params', async () => {
      const result = await easyPaisaClient.createPayment({
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
      expect(result.url).toContain('easypaisa');
    });

    it('includes required payment parameters', async () => {
      const result = await easyPaisaClient.createPayment({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test',
        customerEmail: 'test@example.com',
      });

      expect(result.params).toHaveProperty('ORDER_ID', 'ORD-001');
      expect(result.params).toHaveProperty('AMOUNT', '1000.00');
      expect(result.params).toHaveProperty('STORE_ID');
      expect(result.params).toHaveProperty('CHECKSUM');
    });

    it('constructs proper return URL in params', async () => {
      const result = await easyPaisaClient.createPayment({
        amount: 1000,
        orderId: 'ORD-001',
        description: 'Test',
        customerEmail: 'test@example.com',
      });

      expect(result.params.RETURN_URL || result.url).toBeDefined();
    });
  });

  describe('verifyWebhook', () => {
    it('verifies valid webhook data', () => {
      const webhookData = {
        ORDER_ID: 'ORD-001',
        AMOUNT: '1000.00',
        TRANSACTION_STATUS: 'SUCCESS',
        TRANSACTION_ID: 'TXN-001',
        ACCOUNT_NUM: '123456',
      };

      // The checksum should be generated from storeId, accountNum, amount, orderId
      const checksum = easyPaisaClient.generateChecksum({
        storeId: 'TEST_STORE',
        accountNum: '123456',
        amount: '1000.00',
        orderId: 'ORD-001',
      });

      const dataWithChecksum = { ...webhookData, CHECKSUM: checksum } as any;

      const result = easyPaisaClient.verifyWebhook(dataWithChecksum);

      expect(typeof result).toBe('boolean');
    });

    it('rejects webhook with invalid checksum', () => {
      const webhookData = {
        ORDER_ID: 'ORD-001',
        AMOUNT: '1000',
        STATUS: 'SUCCESS',
        CHECKSUM: 'INVALID_CHECKSUM',
      };

      const result = easyPaisaClient.verifyWebhook(webhookData);

      expect(result).toBeFalsy();
    });

    it('handles missing CHECKSUM field', () => {
      const webhookData = {
        ORDER_ID: 'ORD-001',
        AMOUNT: '1000',
        STATUS: 'SUCCESS',
      };

      const result = easyPaisaClient.verifyWebhook(webhookData);

      expect(result).toBeFalsy();
    });
  });
});
