import { z } from 'zod';

export const connectionRequestSchema = z.object({
  connected_user_id: z.string().uuid('Invalid user ID'),
});

export const messageSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
});

export const groupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  is_private: z.boolean().default(false),
  event_id: z.string().uuid().optional(),
});

export const photoSchema = z.object({
  event_id: z.string().uuid(),
  photo_url: z.string().url('Invalid photo URL'),
  caption: z.string().max(500).optional(),
});

export const postSchema = z.object({
  event_id: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
  media_urls: z.array(z.string().url()).optional(),
});

export type ConnectionRequestInput = z.infer<typeof connectionRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type PhotoInput = z.infer<typeof photoSchema>;
export type PostInput = z.infer<typeof postSchema>;
