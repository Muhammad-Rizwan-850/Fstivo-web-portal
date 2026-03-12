import { NextRequest } from 'next/server'
import { handleStripeWebhook } from '@/lib/payments/webhook'

/**
 * Stripe webhook endpoint
 * Configure this URL in your Stripe webhook dashboard
 */
export async function POST(request: NextRequest): Promise<Response> {
  return handleStripeWebhook(request)
}

/**
 * Stripe webhook requires HEAD support for verification
 */
export async function HEAD(): Promise<Response> {
  return new Response(null, { status: 200 })
}
