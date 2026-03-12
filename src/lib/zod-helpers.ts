import { ZodSchema } from 'zod';

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw result.error;
  return result.data;
}

export function safeParse<T>(schema: ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
