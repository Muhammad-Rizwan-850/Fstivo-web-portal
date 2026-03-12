import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET || '';
const stripe = new Stripe(stripeSecret, {
  apiVersion: (process.env.STRIPE_API_VERSION || undefined) as any,
});

export function verifyStripeWebhook(rawBody: Buffer, sigHeader: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET in environment');
  }
  if (!sigHeader) {
    throw new Error('Missing signature header');
  }
  return stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
}

export default stripe;
