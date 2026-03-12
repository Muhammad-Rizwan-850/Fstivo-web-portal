import Stripe from 'stripe'
import { logger } from '@/lib/logger';

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as const,
      typescript: true,
    })
  }
  return stripeInstance
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'pkr',
  metadata?: Record<string, string>
) {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to smallest currency unit (paisa)
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return { success: true, data: paymentIntent }
  } catch (error) {
    logger.error('Stripe payment intent creation error:', error)
    return { success: false, error: 'Failed to create payment intent' }
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return { success: true, data: paymentIntent }
  } catch (error) {
    logger.error('Stripe payment intent retrieval error:', error)
    return { success: false, error: 'Failed to retrieve payment intent' }
  }
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    return { success: true, data: paymentIntent }
  } catch (error) {
    logger.error('Stripe payment confirmation error:', error)
    return { success: false, error: 'Failed to confirm payment' }
  }
}

/**
 * Create a refund for a payment intent
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
) {
  try {
    const stripe = getStripeClient()
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    if (reason) {
      refundParams.reason = reason
    }

    // If amount is specified, refund partial amount (in paisa)
    if (amount !== undefined) {
      refundParams.amount = amount * 100
    }

    const refund = await stripe.refunds.create(refundParams)
    return { success: true, data: refund }
  } catch (error) {
    logger.error('Stripe refund error:', error)
    return { success: false, error: 'Failed to process refund' }
  }
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(payload: string, signature: string) {
  try {
    const stripe = getStripeClient()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    return { success: true, data: event }
  } catch (error) {
    logger.error('Stripe webhook verification error:', error)
    return { success: false, error: 'Invalid webhook signature' }
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentStatus(paymentIntentId: string): Promise<{
  success: boolean
  status?: string
  amount?: number
  currency?: string
  metadata?: Record<string, string>
  error?: string
}> {
  const result = await retrievePaymentIntent(paymentIntentId)
  if (!result.success) {
    return { success: false, error: result.error }
  }

  const intent = result.data as Stripe.PaymentIntent
  return {
    success: true,
    status: intent.status,
    amount: intent.amount / 100, // Convert back to main currency unit
    currency: intent.currency,
    metadata: intent.metadata as Record<string, string>,
  }
}

// Re-export for convenience
export { getStripeClient as stripe }
