import { createServerClient } from '@/lib/supabase/secure-client';

/**
 * Paginated query with cursor-based pagination
 */
export async function paginatedQuery<T>(
  table: string,
  options: {
    pageSize?: number;
    cursor?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
    select?: string;
  }
) {
  const supabase = await createServerClient();
  const {
    pageSize = 20,
    cursor,
    orderBy = 'created_at',
    orderDirection = 'desc',
    filters = {},
    select = '*'
  } = options;

  let query = supabase
    .from(table)
    .select(select, { count: 'exact' })
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .limit(pageSize);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  // Apply cursor
  if (cursor) {
    query = query.gt(orderBy, cursor);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const nextCursor = data && data.length > 0
    ? (data[data.length - 1] as any)[orderBy]
    : null;

  return {
    data: data as T[],
    nextCursor,
    hasMore: data ? data.length === pageSize : false,
    total: count || 0
  };
}

/**
 * Batch query to reduce round trips
 */
export async function batchQuery<T>(
  queries: Array<() => Promise<any>>
): Promise<T[]> {
  return Promise.all(queries.map(q => q()));
}

/**
 * Query with automatic retries
 */
export async function queryWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}
