import { z } from 'zod';

export const adSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  image_url: z.string().url('Invalid image URL'),
  target_url: z.string().url('Invalid target URL'),
  placement: z.enum(['homepage_hero', 'search_top', 'category_featured', 'sidebar']),
  campaign_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  daily_budget: z.number().positive('Daily budget must be positive'),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export const adCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name is required'),
  total_budget: z.number().positive('Budget must be positive'),
  target_audience: z.object({
    categories: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    age_range: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
});

export type AdInput = z.infer<typeof adSchema>;
export type AdCampaignInput = z.infer<typeof adCampaignSchema>;
