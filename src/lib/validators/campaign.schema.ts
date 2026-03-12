import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  event_id: z.string().uuid(),
  audience_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(3, 'Template name is required'),
  subject: z.string().min(5, 'Subject is required'),
  content: z.string().min(20, 'Content is required'),
  is_public: z.boolean().default(false),
});

export const audienceSchema = z.object({
  name: z.string().min(3, 'Audience name is required'),
  description: z.string().optional(),
  filters: z.object({
    event_id: z.string().uuid().optional(),
    ticket_status: z.array(z.string()).optional(),
    registered_after: z.string().datetime().optional(),
    registered_before: z.string().datetime().optional(),
  }).optional(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type AudienceInput = z.infer<typeof audienceSchema>;
