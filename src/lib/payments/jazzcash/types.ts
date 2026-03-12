/**
 * JazzCash Payment Integration Types
 */

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  sandboxMode: boolean;
}

export interface JazzCashPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
}

export interface JazzCashPaymentResponse {
  url: string;
  params: JazzCashPaymentParams;
}

export interface JazzCashPaymentParams extends Record<string, string> {
  pp_Version: string;
  pp_TxnType: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_SubMerchantID: string;
  pp_Password: string;
  pp_BankID: string;
  pp_ProductID: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnExpiryDateTime: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
  ppmpf_1: string; // Customer email
  ppmpf_2: string; // Customer phone
  ppmpf_3: string;
  ppmpf_4: string;
  ppmpf_5: string;
}

export interface JazzCashWebhookResponse {
  pp_TxnRefNo: string;
  pp_ResponseCode: string;
  pp_ResponseMessage: string;
  pp_SecureHash: string;
  [key: string]: string;
}

export type JazzCashPaymentStatus = 'success' | 'failed' | 'pending';

export interface JazzCashStatusResponse {
  status: JazzCashPaymentStatus;
  message: string;
}
