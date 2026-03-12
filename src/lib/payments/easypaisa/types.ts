/**
 * EasyPaisa Payment Integration Types
 *
 * EasyPaisa is Pakistan's leading mobile banking and payment service
 * with over 6 million active users
 */

export interface EasyPaisaConfig {
  storeId: string;
  secretKey: string;
  returnUrl: string;
  sandboxMode: boolean;
}

export interface EasyPaisaPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  cnic?: string;
}

export interface EasyPaisaPaymentResponse {
  url: string;
  params: EasyPaisaPaymentParams;
  transactionId: string;
}

export interface EasyPaisaPaymentParams {
  STORE_ID: string;
  ACCOUNT_NUM: string;
  AMOUNT: string;
  ORDER_ID: string;
  TXNDESC: string;
  SUCCESS_URL: string;
  FAILURE_URL: string;
  CHECKSUM: string;
  EMAIL: string;
  MOBILE_NUM: string;
  CUSTOMER_NAME: string;
  CNIC?: string;
}

export interface EasyPaisaWebhookResponse {
  ORDER_ID: string;
  TRANSACTION_STATUS: 'SUCCESS' | 'FAILURE' | 'PENDING';
  TRANSACTION_ID: string;
  AMOUNT: string;
  CHECKSUM: string;
  RESPONSE_CODE?: string;
  RESPONSE_MSG?: string;
  [key: string]: string | undefined;
}

export type EasyPaisaPaymentStatus = 'success' | 'failed' | 'pending';

export interface EasyPaisaStatusResponse {
  status: EasyPaisaPaymentStatus;
  message: string;
  transactionId?: string;
}
