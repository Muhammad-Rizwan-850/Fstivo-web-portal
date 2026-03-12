// =====================================================
// FSTIVO SERVER ACTIONS - CENTRAL EXPORT
// =====================================================
// All server actions are exported from this file
// for easy importing throughout the application
// =====================================================

// Auth actions
export * from './auth';

// Event actions
export * from './events';

// Ticket actions
export * from './tickets';

// Social actions
export * from './social';

// Check-in actions
export * from './checkin';

// Campaign actions
export * from './campaigns';

// Template actions
export * from './templates';

// Seating actions
export * from './seating';

// Subscription actions
export * from './subscriptions';

// Sponsored events actions
export * from './sponsored';

// Ad actions
export * from './ads';

// Affiliate actions
export * from './affiliate';

// Analytics actions
export * from './analytics';

// Notification actions
export * from './notifications';

// Admin actions
export * from './admin';

// =====================================================
// UTILITY EXPORTS
// =====================================================

/**
 * Revalidates multiple paths at once
 * @param paths Array of paths to revalidate
 */
export async function revalidatePaths(paths: string[]) {
  const { revalidatePath } = await import('next/cache');
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Creates a success response object
 * @param data The data to return
 */
export function successResponse<T>(data: T) {
  return { success: true, data };
}

/**
 * Creates an error response object
 * @param message The error message
 */
export function errorResponse(message: string) {
  return { success: false, error: message };
}

/**
 * Creates a paginated response object
 */
export type PaginatedResult<T> = {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Paginates an array of items
 * @param items Array of items to paginate
 * @param page Current page number (1-indexed)
 * @param limit Number of items per page
 */
export function paginate<T>(items: T[], page: number = 1, limit: number = 10): PaginatedResult<T> {
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    success: true,
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
    },
  };
}

// =====================================================
// TYPE EXPORTS
// =====================================================

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedItems<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type DashboardStats = {
  events: number;
  tickets: number;
  revenue: number;
  attendees: number;
  orders: number;
};

export type EventAnalytics = {
  totalTickets: number;
  soldTickets: number;
  checkedIn: number;
};

export type RevenueReport = {
  orders: number;
  revenue: number;
  commissions: number;
  refunds: number;
};
