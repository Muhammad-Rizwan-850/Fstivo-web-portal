import { z } from 'zod';

export const subscriptionSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  payment_method: z.enum(['stripe', 'jazzcash', 'easypaisa']),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  interval: z.enum(['month', 'year']),
  max_events: z.number().int().min(-1), // -1 for unlimited
  max_attendees: z.number().int().min(-1), // -1 for unlimited
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
