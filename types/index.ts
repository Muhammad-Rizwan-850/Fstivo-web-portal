// ========== Central Type Exports ==========
// This file exports all custom types used throughout the application

// Export Supabase types
export * from './supabase';

// ========== Utility Types ==========

/**
 * Nullable type - can be null or T
 */
export type Nullable<T> = T | null;

/**
 * Optional type - can be undefined or T
 */
export type Optional<T> = T | undefined;

/**
 * Maybe type - can be null, undefined, or T
 */
export type Maybe<T> = T | null | undefined;

/**
 * Get the return type of an async function
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

/**
 * Prettify type - makes type definitions more readable
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Get the value type of an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Non-empty array - array with at least one element
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required keys - make specific keys required
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Optional keys - make specific keys optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ========== API Response Types ==========

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Error response type
 */
export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// ========== Form Types ==========

/**
 * Standard form state
 */
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

/**
 * Form field configuration
 */
export interface FieldConfig {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  validation?: RegExp;
  errorMessage?: string;
}

// ========== User & Auth Types ==========

/**
 * User roles in the system
 */
export type UserRole =
  | 'admin'
  | 'organizer'
  | 'attendee'
  | 'sponsor'
  | 'volunteer'
  | 'community_partner'
  | 'vendor';

/**
 * User status
 */
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

/**
 * Auth session data
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
    full_name?: string;
  };
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ========== Event Types ==========

/**
 * Event categories
 */
export type EventCategory =
  | 'conference'
  | 'workshop'
  | 'concert'
  | 'exhibition'
  | 'sports'
  | 'social'
  | 'networking'
  | 'charity'
  | 'other';

/**
 * Event status
 */
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

/**
 * Event data structure
 */
export interface EventData {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number;
  organizer_id: string;
  status: EventStatus;
  banner_url?: string;
  is_featured: boolean;
}

// ========== Ticket Types ==========

/**
 * Ticket status
 */
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'expired';

/**
 * Ticket data structure
 */
export interface TicketData {
  id: string;
  user_id: string;
  event_id: string;
  tier_id: string;
  order_id: string;
  qr_code: string;
  status: TicketStatus;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
}

// ========== Payment Types ==========

/**
 * Payment methods
 */
export type PaymentMethod = 'stripe' | 'jazzcash' | 'easypaisa';

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Order data structure
 */
export interface OrderData {
  id: string;
  user_id: string;
  event_id: string;
  subtotal: number;
  fees: number;
  total: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_intent_id?: string;
}

// ========== Notification Types ==========

/**
 * Notification types
 */
export type NotificationType =
  | 'event_reminder'
  | 'ticket_purchase'
  | 'event_update'
  | 'check_in'
  | 'promotion'
  | 'system';

/**
 * Notification data structure
 */
export interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// ========== Analytics Types ==========

/**
 * Time range for analytics
 */
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Analytics data points
 */
export interface AnalyticsData {
  date: string;
  views: number;
  registrations: number;
  revenue: number;
}

// ========== Search & Filter Types ==========

/**
 * Search filters
 */
export interface SearchFilters {
  query?: string;
  category?: EventCategory;
  location?: string;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
  capacity_min?: number;
}

/**
 * Sort options
 */
export type SortOption = 'date' | 'popularity' | 'price_asc' | 'price_desc' | 'name';

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

// ========== Dashboard Types ==========

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  upcomingEvents: number;
  activeTickets: number;
}
