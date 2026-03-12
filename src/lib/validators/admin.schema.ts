import { z } from 'zod';

export const userUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(['attendee', 'organizer', 'volunteer', 'sponsor', 'admin', 'super_admin']).optional(),
  is_verified: z.boolean().optional(),
  is_banned: z.boolean().optional(),
});

export const eventModerationSchema = z.object({
  status: z.enum(['published', 'draft', 'cancelled', 'under_review']),
  rejection_reason: z.string().optional(),
});

export const sponsorApprovalSchema = z.object({
  status: z.enum(['active', 'rejected', 'pending']),
  rejection_reason: z.string().optional(),
});

export const affiliateApprovalSchema = z.object({
  status: z.enum(['active', 'rejected', 'pending', 'suspended']),
  rejection_reason: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type EventModerationInput = z.infer<typeof eventModerationSchema>;
export type SponsorApprovalInput = z.infer<typeof sponsorApprovalSchema>;
export type AffiliateApprovalInput = z.infer<typeof affiliateApprovalSchema>;
