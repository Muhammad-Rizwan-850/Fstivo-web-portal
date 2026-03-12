import { z } from 'zod';

export const paymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['PKR', 'USD']).default('PKR'),
  order_id: z.string().uuid(),
  payment_method: z.enum(['stripe', 'jazzcash', 'easypaisa']),
});

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

export const jazzcashWebhookSchema = z.object({
  pp_TxnRefNo: z.string(),
  pp_Amount: z.string(),
  pp_ResponseCode: z.string(),
  pp_ResponseMessage: z.string(),
  pp_SecureHash: z.string(),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
