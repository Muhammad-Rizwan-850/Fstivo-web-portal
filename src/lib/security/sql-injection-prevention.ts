// =====================================================
// FSTIVO SECURITY - SQL INJECTION PREVENTION
// =====================================================
// Safe query builders and input sanitization
// Prevents SQL injection attacks
// =====================================================

import { createClient } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

// =====================================================
// INPUT SANITIZATION
// =====================================================

/**
 * Sanitize user input to prevent SQL injection
 * Note: Supabase uses parameterized queries by default,
 * but this adds an extra layer of defense
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*/g, '')
    // Remove SQL statement terminators
    .replace(/;/g, '')
    // Escape SQL wildcards
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    // Limit length
    .slice(0, 1000);
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return sanitizeInput(query)
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize array of values
 */
export function sanitizeArray(values: string[]): string[] {
  return values.map(sanitizeInput).filter(Boolean);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
}

// =====================================================
// SAFE QUERY BUILDERS
// =====================================================

/**
 * Safe search for attendees
 */
export async function safeSearchAttendees(
  eventId: string,
  searchQuery: string,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = await createClient();

  // Validate event ID
  if (!isValidUUID(eventId)) {
    throw new Error('Invalid event ID');
  }

  // Sanitize search query
  const sanitizedQuery = sanitizeSearchQuery(searchQuery);

  if (sanitizedQuery.length === 0) {
    return { data: [], total: 0, page, pageSize };
  }

  // Validate pagination
  const validPage = Math.max(1, Math.min(page, 1000));
  const validPageSize = Math.max(1, Math.min(pageSize, 100));
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;

  // Use parameterized query (Supabase does this automatically)
  const { data, count, error } = await supabase
    .from('attendees')
    .select('*, registrations!inner(*)', { count: 'exact' })
    .eq('registrations.event_id', eventId)
    .or(`full_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Search error:', error);
    throw error;
  }

  return { data: data || [], total: count || 0, page: validPage, pageSize: validPageSize };
}

/**
 * Safe search for events
 */
export async function safeSearchEvents(
  searchQuery: string,
  filters: {
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = await createClient();

  // Sanitize search query
  const sanitizedQuery = sanitizeSearchQuery(searchQuery);

  // Validate filters
  const validFilters: Record<string, any> = {};

  if (filters.category) {
    validFilters.category = sanitizeInput(filters.category);
  }

  if (filters.status) {
    const allowedStatuses = ['draft', 'published', 'cancelled', 'completed'];
    if (allowedStatuses.includes(filters.status)) {
      validFilters.status = filters.status;
    }
  }

  // Validate pagination
  const validPage = Math.max(1, Math.min(page, 1000));
  const validPageSize = Math.max(1, Math.min(pageSize, 100));
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;

  // Build query
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .gte('start_date', new Date().toISOString());

  // Apply search
  if (sanitizedQuery.length > 0) {
    query = query.or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
  }

  // Apply filters
  Object.entries(validFilters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  // Apply date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    if (!isNaN(startDate.getTime())) {
      query = query.gte('start_date', startDate.toISOString());
    }
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    if (!isNaN(endDate.getTime())) {
      query = query.lte('start_date', endDate.toISOString());
    }
  }

  // Execute query with pagination
  const { data, count, error } = await query
    .range(from, to)
    .order('start_date', { ascending: true });

  if (error) {
    logger.error('Search error:', error);
    throw error;
  }

  return { data: data || [], total: count || 0, page: validPage, pageSize: validPageSize };
}

/**
 * Safe attendee lookup
 */
export async function safeGetAttendee(attendeeId: string) {
  const supabase = await createClient();

  // Validate ID
  if (!isValidUUID(attendeeId)) {
    throw new Error('Invalid attendee ID');
  }

  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('id', attendeeId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Safe event lookup
 */
export async function safeGetEvent(eventId: string) {
  const supabase = await createClient();

  // Validate ID
  if (!isValidUUID(eventId)) {
    throw new Error('Invalid event ID');
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// =====================================================
// SAFE ORDER BY CLAUSE
// =====================================================

const ALLOWED_ORDER_COLUMNS = {
  events: ['created_at', 'start_date', 'title', 'status', 'category'],
  attendees: ['created_at', 'full_name', 'email'],
  registrations: ['created_at', 'total_amount', 'status', 'payment_status'],
  tickets: ['created_at', 'status', 'qr_code'],
};

const ALLOWED_ORDER_DIRECTION = ['asc', 'desc', 'ascending', 'descending'];

/**
 * Validate order by column and direction
 */
export function validateOrderBy(
  table: string,
  column?: string,
  direction?: string
): { column: string; direction: 'asc' | 'desc' } | null {
  // Default ordering
  if (!column) {
    return { column: 'created_at', direction: 'desc' };
  }

  // Check if column is allowed
  const allowedColumns = ALLOWED_ORDER_COLUMNS[table as keyof typeof ALLOWED_ORDER_COLUMNS];
  if (!allowedColumns || !allowedColumns.includes(column)) {
    logger.warn(`Invalid order by column: ${column} for table: ${table}`);
    return { column: 'created_at', direction: 'desc' };
  }

  // Validate direction
  const normalizedDirection = direction?.toLowerCase() as 'asc' | 'desc';
  if (
    !normalizedDirection ||
    !ALLOWED_ORDER_DIRECTION.includes(normalizedDirection)
  ) {
    return { column, direction: 'desc' };
  }

  const finalDirection = normalizedDirection === 'asc' ? 'asc' : 'desc';

  return { column, direction: finalDirection };
}

// =====================================================
// SAFE FILTER BUILDER
// =====================================================

interface FilterOptions {
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  gt?: Record<string, any>;
  gte?: Record<string, any>;
  lt?: Record<string, any>;
  lte?: Record<string, any>;
  like?: Record<string, any>;
  ilike?: Record<string, any>;
  in?: Record<string, any[]>;
  is?: Record<string, boolean | null>;
}

/**
 * Build safe filter object
 */
export function buildSafeFilters(
  table: string,
  filters: FilterOptions
): FilterOptions {
  const safeFilters: FilterOptions = {};

  // Equality filters
  if (filters.eq) {
    safeFilters.eq = {};
    for (const [key, value] of Object.entries(filters.eq)) {
      // Only allow if column is in allowed list
      const allowedColumns = ALLOWED_ORDER_COLUMNS[table as keyof typeof ALLOWED_ORDER_COLUMNS];
      if (allowedColumns?.includes(key)) {
        safeFilters.eq![key] = sanitizeInput(String(value));
      }
    }
  }

  // LIKE filters (more restrictive)
  if (filters.ilike) {
    safeFilters.ilike = {};
    for (const [key, value] of Object.entries(filters.ilike)) {
      // Only allow text columns
      const allowedColumns = ALLOWED_ORDER_COLUMNS[table as keyof typeof ALLOWED_ORDER_COLUMNS];
      if (allowedColumns?.includes(key) && typeof value === 'string') {
        safeFilters.ilike![key] = sanitizeSearchQuery(value);
      }
    }
  }

  // Other filters
  if (filters.gt) safeFilters.gt = filters.gt;
  if (filters.gte) safeFilters.gte = filters.gte;
  if (filters.lt) safeFilters.lt = filters.lt;
  if (filters.lte) safeFilters.lte = filters.lte;
  if (filters.neq) safeFilters.neq = filters.neq;
  if (filters.in) safeFilters.in = filters.in;
  if (filters.is) safeFilters.is = filters.is;

  return safeFilters;
}

// =====================================================
// PARAMETERIZED QUERY HELPER
// =====================================================

/**
 * Execute safe raw SQL (for complex queries)
 * Note: This should be used sparingly. Prefer Supabase queries.
 */
export async function executeSafeRawSQL<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const supabase = await createClient();

  // Validate SQL doesn't contain dangerous patterns
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /TRUNCATE/i,
    /ALTER\s+TABLE/i,
    /EXEC\s*\(/i,
    /EVAL\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error('Dangerous SQL pattern detected');
    }
  }

  // Sanitize parameters
  const sanitizedParams = params.map(param => {
    if (typeof param === 'string') {
      return sanitizeInput(param);
    }
    return param;
  });

  // Execute via Supabase RPC (safer than direct SQL)
  const { data, error } = await (supabase.rpc as any)('execute_raw_sql', {
    p_sql: sql,
    p_params: sanitizedParams,
  });

  if (error) {
    logger.error('Raw SQL error:', error);
    throw error;
  }

  return (data as T[]) || [];
}
