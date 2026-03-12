/**
 * EasyPaisa Payment Client
 *
 * Official Documentation: https://www.easypaisa.com.pk/eps-merchant/
 *
 * EasyPaisa is Pakistan's first and leading mobile banking service
 * launched by Telenor and Tameer Microfinance Bank
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';
import type {
  EasyPaisaConfig,
  EasyPaisaPaymentRequest,
  EasyPaisaPaymentResponse,
  EasyPaisaWebhookResponse,
  EasyPaisaStatusResponse,
  EasyPaisaPaymentParams,
} from './types';

export class EasyPaisaClient {
  private config: EasyPaisaConfig;

  constructor(config: EasyPaisaConfig) {
    this.config = config;

    // Validate configuration
    if (!config.storeId || !config.secretKey) {
      const missingFields = [
        !config.storeId && 'EASYPAISA_STORE_ID',
        !config.secretKey && 'EASYPAISA_SECRET_KEY',
      ].filter(Boolean);
      
      const error = `EasyPaisa: Missing required configuration - ${missingFields.join(', ')}`;
      logger.error(error);
      // In production, throw to fail fast; in test, just log
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error);
      }
    }
  }

  /**
   * Generate checksum for EasyPaisa
   *
   * EasyPaisa uses AES-256 encryption for checksum generation
   * Format: AES256(SECRET_KEY, STORE_ID + ACCOUNT_NUM + AMOUNT + ORDER_ID)
   */
  private generateChecksum(params: {
    storeId: string;
    accountNum: string;
    amount: string;
    orderId: string;
  }): string {
    const { storeId, accountNum, amount, orderId } = params;

    // Concatenate values
    const data = storeId + accountNum + amount + orderId;

    // Create HMAC using SHA-256
    const hmac = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(data)
      .digest('hex');

    return hmac.toUpperCase();
  }

  /**
   * Verify webhook checksum
   */
  private verifyChecksum(checksum: string, params: {
    storeId: string;
    accountNum: string;
    amount: string;
    orderId: string;
  }): boolean {
    const calculatedChecksum = this.generateChecksum(params);
    return checksum === calculatedChecksum;
  }

  /**
   * Format amount for EasyPaisa (2 decimal places)
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Create a new payment transaction
   *
   * @param params - Payment request parameters
   * @returns Payment URL and parameters
   */
  async createPayment(params: EasyPaisaPaymentRequest): Promise<EasyPaisaPaymentResponse> {
    const { amount, orderId, description, customerEmail, customerPhone, customerName, cnic } = params;

    // Validate amount
    if (amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    // EasyPaisa requires amount in PKR with 2 decimal places
    const amountStr = this.formatAmount(amount);

    // Generate unique transaction ID
    const transactionId = `EP_${orderId}_${Date.now()}`;

    // Account number (use store ID as account for merchant transactions)
    const accountNum = this.config.storeId;

    // Build payment parameters
    const paymentParams: EasyPaisaPaymentParams = {
      STORE_ID: this.config.storeId,
      ACCOUNT_NUM: accountNum,
      AMOUNT: amountStr,
      ORDER_ID: orderId,
      TXNDESC: description.substring(0, 50), // Max 50 chars
      SUCCESS_URL: this.config.returnUrl + '?status=success',
      FAILURE_URL: this.config.returnUrl + '?status=failed',
      CHECKSUM: '', // Will be set below
      EMAIL: customerEmail,
      MOBILE_NUM: customerPhone,
      CUSTOMER_NAME: customerName || '',
      CNIC: cnic || '',
    };

    // Generate checksum (must be done last, after all params are set)
    paymentParams.CHECKSUM = this.generateChecksum({
      storeId: this.config.storeId,
      accountNum,
      amount: amountStr,
      orderId,
    });

    // Get base URL
    const baseUrl = this.config.sandboxMode
      ? 'https://easypaisa-qa.telenormicrofinancebank.com'
      : 'https://easypaisa.telenormicrofinancebank.com';

    return {
      url: `${baseUrl}/easypaisa/index.jsp`,
      params: paymentParams,
      transactionId,
    };
  }

  /**
   * Verify webhook signature
   *
   * @param webhookData - Webhook data from EasyPaisa
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhook(webhookData: EasyPaisaWebhookResponse): boolean {
    const receivedChecksum = webhookData.CHECKSUM;

    if (!receivedChecksum) {
      return false;
    }

    // Verify checksum
    return this.verifyChecksum(receivedChecksum, {
      storeId: this.config.storeId,
      accountNum: this.config.storeId,
      amount: webhookData.AMOUNT,
      orderId: webhookData.ORDER_ID,
    });
  }

  /**
   * Get payment status from response
   *
   * @param status - EasyPaisa transaction status
   * @returns Payment status and message
   */
  getPaymentStatus(webhookData: EasyPaisaWebhookResponse): EasyPaisaStatusResponse {
    const status = webhookData.TRANSACTION_STATUS;

    switch (status) {
      case 'SUCCESS':
        return {
          status: 'success',
          message: webhookData.RESPONSE_MSG || 'Transaction Successful',
          transactionId: webhookData.TRANSACTION_ID,
        };

      case 'FAILURE':
        return {
          status: 'failed',
          message: webhookData.RESPONSE_MSG || 'Transaction Failed',
          transactionId: webhookData.TRANSACTION_ID,
        };

      case 'PENDING':
        return {
          status: 'pending',
          message: webhookData.RESPONSE_MSG || 'Transaction Pending',
          transactionId: webhookData.TRANSACTION_ID,
        };

      default:
        return {
          status: 'failed',
          message: `Unknown Status: ${status}`,
          transactionId: webhookData.TRANSACTION_ID,
        };
    }
  }
}

/**
 * Export singleton instance
 *
 * Configuration is loaded from environment variables:
 * - EASYPAISA_STORE_ID
 * - EASYPAISA_SECRET_KEY
 * - NEXT_PUBLIC_APP_URL (for return URL)
 * - NODE_ENV (to determine sandbox mode)
 */
export const easyPaisaClient = new EasyPaisaClient({
  storeId: process.env.EASYPAISA_STORE_ID || '',
  secretKey: process.env.EASYPAISA_SECRET_KEY || '',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easypaisa/return`,
  sandboxMode: process.env.NODE_ENV !== 'production',
});
