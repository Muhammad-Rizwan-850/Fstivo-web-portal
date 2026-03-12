import { z } from 'zod';

export const ticketPurchaseSchema = z.object({
  tier_id: z.string().uuid('Invalid tier ID'),
  quantity: z.number().int().min(1, 'Must purchase at least 1 ticket').max(10, 'Maximum 10 tickets per order'),
  seat_id: z.string().uuid().optional().nullable(),
  promo_code: z.string().optional(),
});

export const ticketTransferSchema = z.object({
  recipient_email: z.string().email('Invalid email address'),
  recipient_name: z.string().min(2, 'Recipient name is required'),
});

export const ticketTierSchema = z.object({
  name: z.string().min(3, 'Tier name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  quantity: z.number().int().positive('Quantity must be positive'),
  event_id: z.string().uuid(),
  max_per_order: z.number().int().positive().optional(),
  sale_start: z.string().datetime().optional(),
  sale_end: z.string().datetime().optional(),
});

export type TicketPurchaseInput = z.infer<typeof ticketPurchaseSchema>;
export type TicketTransferInput = z.infer<typeof ticketTransferSchema>;
export type TicketTierInput = z.infer<typeof ticketTierSchema>;
