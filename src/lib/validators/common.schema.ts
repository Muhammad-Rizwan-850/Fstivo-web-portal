import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  filters: z.record(z.unknown()).optional(),
});

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.enum(['avatars', 'banners', 'photos', 'documents']),
  max_size: z.number().default(5 * 1024 * 1024), // 5MB default
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
