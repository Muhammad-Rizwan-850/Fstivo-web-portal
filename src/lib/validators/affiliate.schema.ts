import { z } from 'zod';

export const affiliateRegistrationSchema = z.object({
  company_name: z.string().optional(),
  website: z.string().url().optional(),
  social_media: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
  }).optional(),
  promotional_methods: z.array(z.string()).min(1, 'Select at least one promotional method'),
  expected_monthly_sales: z.number().int().positive().optional(),
});

export const affiliateLinkSchema = z.object({
  event_id: z.string().uuid(),
  custom_slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().min(1000, 'Minimum payout is PKR 1,000'),
  payment_method: z.enum(['bank_transfer', 'jazzcash', 'easypaisa']),
  account_details: z.object({
    account_name: z.string().min(3),
    account_number: z.string().min(5),
    bank_name: z.string().optional(),
  }),
});

export type AffiliateRegistrationInput = z.infer<typeof affiliateRegistrationSchema>;
export type AffiliateLinkInput = z.infer<typeof affiliateLinkSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
