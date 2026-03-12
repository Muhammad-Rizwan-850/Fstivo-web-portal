export { stripe, createPaymentIntent, retrievePaymentIntent, confirmPaymentIntent, createRefund, getPaymentStatus } from './stripe/client'
export { jazzCashClient, JazzCashClient } from './jazzcash/client'
export { easyPaisaClient, EasyPaisaClient } from './easypaisa/client'

export type PaymentProvider = 'stripe' | 'jazzcash' | 'easypaisa'

export interface PaymentRequest {
  amount: number
  currency?: string
  orderId: string
  description: string
  returnUrl?: string
  metadata?: Record<string, string>
  email?: string
  phone?: string
}

export async function initiatePayment(
  provider: PaymentProvider,
  request: PaymentRequest
) {
  switch (provider) {
    case 'stripe':
      const { createPaymentIntent } = await import('./stripe/client')
      return createPaymentIntent(request.amount, request.currency, request.metadata)

    case 'jazzcash':
      const { jazzCashClient } = await import('./jazzcash/client')
      const jazzCashResult = await jazzCashClient.createPayment({
        amount: request.amount,
        orderId: request.orderId,
        description: request.description,
        customerEmail: request.email || '',
        customerPhone: request.phone || '',
      })
      return {
        success: true,
        data: jazzCashResult,
      }

    case 'easypaisa':
      const { easyPaisaClient } = await import('./easypaisa/client')
      const easyPaisaResult = await easyPaisaClient.createPayment({
        amount: request.amount,
        orderId: request.orderId,
        description: request.description,
        customerEmail: request.email || '',
        customerPhone: request.phone || '',
      })
      return {
        success: true,
        data: easyPaisaResult,
      }

    default:
      return { success: false, error: 'Invalid payment provider' }
  }
}
