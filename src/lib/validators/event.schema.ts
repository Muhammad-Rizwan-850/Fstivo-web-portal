import { z } from 'zod';

const baseEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  start_date: z.string().datetime('Invalid start date'),
  end_date: z.string().datetime('Invalid end date'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  banner_url: z.string().url().optional().nullable(),
  venue_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean().optional(),
});

export const eventSchema = baseEventSchema.refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export const eventUpdateSchema = baseEventSchema.partial();

export type EventInput = z.infer<typeof eventSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
