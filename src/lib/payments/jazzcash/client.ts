/**
 * JazzCash Payment Client
 *
 * Official Documentation: https://jazzcash.com.pk/merchant-portal/documentation/
 *
 * JazzCash is a leading mobile wallet and payment gateway in Pakistan
 * with over 10 million active users.
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';
import type {
  JazzCashConfig,
  JazzCashPaymentRequest,
  JazzCashPaymentResponse,
  JazzCashWebhookResponse,
  JazzCashStatusResponse,
  JazzCashPaymentParams,
} from './types';

export class JazzCashClient {
  private config: JazzCashConfig;

  constructor(config: JazzCashConfig) {
    this.config = config;

    // Validate configuration
    if (!config.merchantId || !config.password || !config.integritySalt) {
      const missingFields = [
        !config.merchantId && 'JAZZCASH_MERCHANT_ID',
        !config.password && 'JAZZCASH_PASSWORD',
        !config.integritySalt && 'JAZZCASH_INTEGRITY_SALT',
      ].filter(Boolean);
      
      const error = `JazzCash: Missing required configuration - ${missingFields.join(', ')}`;
      logger.error(error);
      // In production, throw to fail fast; in test, just log
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error);
      }
    }
  }

  /**
   * Generate secure hash using HMAC-SHA256
   *
   * JazzCash requires a specific hash format:
   * INTEGRITY_SALT&key1=value1&key2=value2&...&keyN=valueN
   * Keys must be sorted alphabetically
   */
  private generateSecureHash(params: Record<string, string>): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Build hash string: SALT&key1=value1&key2=value2&...
    let hashString = this.config.integritySalt + '&';

    sortedKeys.forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        hashString += key + '=' + params[key] + '&';
      }
    });

    // Remove trailing &
    hashString = hashString.slice(0, -1);

    // Generate HMAC-SHA256 hash
    const hash = crypto
      .createHmac('sha256', this.config.integritySalt)
      .update(hashString)
      .digest('hex')
      .toUpperCase();

    return hash;
  }

  /**
   * Format timestamp for JazzCash (YYYYMMDDHHmmss)
   */
  private formatTimestamp(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
  }

  /**
   * Create a new payment transaction
   *
   * @param params - Payment request parameters
   * @returns Payment URL and parameters
   */
  async createPayment(params: JazzCashPaymentRequest): Promise<JazzCashPaymentResponse> {
    const { amount, orderId, description, customerEmail, customerPhone, customerName } = params;

    // Validate amount
    if (amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    // JazzCash requires amount in paisas (PKR * 100)
    const amountInPaisas = Math.round(amount * 100).toString();

    // Current timestamp
    const txnDateTime = this.formatTimestamp(new Date());

    // Expiry: 1 hour from now
    const expiryDateTime = this.formatTimestamp(new Date(Date.now() + 60 * 60 * 1000));

    // Build payment parameters
    const paymentParams: JazzCashPaymentParams = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET', // Mobile wallet transaction
      pp_Language: 'EN',
      pp_MerchantID: this.config.merchantId,
      pp_SubMerchantID: '',
      pp_Password: this.config.password,
      pp_BankID: '',
      pp_ProductID: '',
      pp_TxnRefNo: orderId,
      pp_Amount: amountInPaisas,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: orderId,
      pp_Description: description.substring(0, 100), // Max 100 chars
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_ReturnURL: this.config.returnUrl,
      pp_SecureHash: '', // Will be set below
      ppmpf_1: customerEmail,
      ppmpf_2: customerPhone,
      ppmpf_3: customerName || '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    // Generate secure hash (must be done last, after all params are set)
    paymentParams.pp_SecureHash = this.generateSecureHash(paymentParams);

    // Get base URL
    const baseUrl = this.config.sandboxMode
      ? 'https://sandbox.jazzcash.com.pk'
      : 'https://payments.jazzcash.com.pk';

    return {
      url: `${baseUrl}/CustomerPortal/transactionmanagement/merchantform`,
      params: paymentParams,
    };
  }

  /**
   * Verify webhook signature
   *
   * @param webhookData - Webhook data from JazzCash
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhook(webhookData: JazzCashWebhookResponse): boolean {
    const receivedHash = webhookData.pp_SecureHash;

    // Remove pp_SecureHash from params before calculating hash
    const { pp_SecureHash, ...paramsToHash } = webhookData;

    const calculatedHash = this.generateSecureHash(paramsToHash);

    return receivedHash === calculatedHash;
  }

  /**
   * Get payment status from response code
   *
   * @param responseCode - JazzCash response code
   * @returns Payment status and message
   */
  getPaymentStatus(responseCode: string): JazzCashStatusResponse {
    const statusMap: Record<string, JazzCashStatusResponse> = {
      '000': {
        status: 'success',
        message: 'Transaction Successful',
      },
      '001': {
        status: 'failed',
        message: 'Account Blocked',
      },
      '002': {
        status: 'failed',
        message: 'Account Closed',
      },
      '003': {
        status: 'failed',
        message: 'Transaction Declined',
      },
      '004': {
        status: 'failed',
        message: 'Insufficient Balance',
      },
      '005': {
        status: 'failed',
        message: 'Invalid Transaction',
      },
      '006': {
        status: 'failed',
        message: 'Duplicate Transaction',
      },
      '007': {
        status: 'failed',
        message: 'Transaction Expired',
      },
      '008': {
        status: 'failed',
        message: 'Invalid Amount',
      },
      '009': {
        status: 'failed',
        message: 'Invalid Currency',
      },
      '010': {
        status: 'failed',
        message: 'Invalid Merchant',
      },
      '011': {
        status: 'failed',
        message: 'Invalid Customer',
      },
      '012': {
        status: 'pending',
        message: 'Transaction Processing',
      },
      '013': {
        status: 'failed',
        message: 'Transaction Failed',
      },
      '014': {
        status: 'failed',
        message: 'Timeout',
      },
      '015': {
        status: 'failed',
        message: 'Transaction Cancelled',
      },
      '124': {
        status: 'pending',
        message: 'Transaction Pending',
      },
      '125': {
        status: 'pending',
        message: 'Transaction Being Processed',
      },
    };

    return (
      statusMap[responseCode] || {
        status: 'failed',
        message: `Unknown Error (Code: ${responseCode})`,
      }
    );
  }
}

/**
 * Export singleton instance
 *
 * Configuration is loaded from environment variables:
 * - JAZZCASH_MERCHANT_ID
 * - JAZZCASH_PASSWORD
 * - JAZZCASH_INTEGRITY_SALT
 * - NEXT_PUBLIC_APP_URL (for return URL)
 * - NODE_ENV (to determine sandbox mode)
 */
export const jazzCashClient = new JazzCashClient({
  merchantId: process.env.JAZZCASH_MERCHANT_ID || '',
  password: process.env.JAZZCASH_PASSWORD || '',
  integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || '',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/jazzcash/return`,
  sandboxMode: process.env.NODE_ENV !== 'production',
});
