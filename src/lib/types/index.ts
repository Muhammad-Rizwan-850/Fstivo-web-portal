// Global type definitions

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'attendee' | 'organizer' | 'volunteer' | 'sponsor' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface RegistrationWithEvent {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  quantity?: number;
  registration_number?: string;
  created_at: string;
  checked_in_at: string | null;
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    venue_city: string;
    cover_image_url: string | null;
    event_mode: string;
    status: string;
  };
  ticket_type: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  category: string | EventCategory;
  category_id?: string;
  event_type?: string;
  event_mode?: string;
  is_virtual?: boolean;
  start_date: string;
  end_date: string;
  location: any; // JSONB field - can contain city, address, etc.
  venue_name?: string;
  venue_city?: string;
  virtual_meeting_link?: string;
  organizer_id: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_published?: boolean;
  capacity: number;
  currency?: string;
  banner_url: string | null;
  banner_image?: string;
  cover_image_url?: string | null;
  is_featured: boolean;
  price?: number;
  ticket_types?: any[]; // Array of ticket types
  required_skills?: string[]; // Array of required skills
  _count?: {
    registrations?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  registration_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  dietary_requirements?: string;
  checked_in_at?: string | null;
  created_at?: string;
}

export interface UserDashboardStats {
  totalRegistrations: number;
  upcomingEvents: number;
  checkedInCount: number;
  pendingPayments: number;
  totalSpent: number;
  eventsAttended: number;
}

export type EventMode = 'in-person' | 'virtual' | 'hybrid';

export type EventType = 'conference' | 'workshop' | 'seminar' | 'competition' | 'networking' | 'social' | 'exhibition' | 'other';

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  displayOrder: number;
}

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  tier_id: string;
  order_id: string;
  seat_id: string | null;
  qr_code: string;
  status: 'active' | 'used' | 'cancelled' | 'transferred';
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id?: string;
  registration_number: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'attended';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_amount?: number;
  payment_id?: string;
  payment_method?: string;
  payment_date?: string;
  total_amount: number;
  registration_data?: any;
  custom_answers?: any;
  emergency_contact?: any;
  checked_in_at?: string;
  check_in_method?: string;
  qr_code?: string;
  registered_at: string;
  updated_at: string;
  cancelled_at?: string;
  refunded_at?: string;
}

export interface RegistrationInput {
  event_id: string;
  user_id?: string;
  ticket_type_id?: string;
  payment_method?: string;
  total_amount: number;
  quantity?: number;
  attendees?: any;
  registration_data?: any;
  custom_answers?: any;
  emergency_contact?: any;
}

export interface AttendeeInput {
  registration_id: string;
  full_name: string;
  email: string;
  phone?: string;
  dietary_requirements?: string;
}

export type PaymentMethod = 'stripe' | 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'paypal' | 'cash' | 'free';

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available?: number;
  quantity_sold: number;
  sale_start_date?: string;
  sale_end_date?: string;
  is_early_bird: boolean;
  max_per_order: number;
  valid_from?: string;
  valid_until?: string;
  benefits?: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketData {
  id: string;
  registration_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  quantity: number;
  qr_code_data: string;
  qrCodeDataURL?: string; // Alternative camelCase version
  checked_in_at: string | null;
  created_at: string;
  event: any; // EventWithOrganizer - avoiding circular reference
  ticket_type: TicketType;
  attendees: Attendee[];
}

export interface EventDiscoveryItem {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  category: string | EventCategory;
  category_id?: string;
  field_id?: string;
  event_type?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  start_date: string;
  end_date: string;
  location: any;
  event_mode?: string;
  venue_name?: string;
  venue_city?: string;
  capacity: number;
  banner_url: string | null;
  banner_image?: string;
  cover_image_url?: string | null;
  is_featured: boolean;
  is_published?: boolean;
  price?: number;
  currency?: string;
  ticket_types?: any[];
  organizer_id: string;
  created_at?: string;
  updated_at?: string;
  virtual_meeting_link?: string;
  _count?: {
    registrations?: number;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  event_id: string;
  tier_id: string;
  order_id: string;
  seat_id: string | null;
  qr_code: string;
  status: 'active' | 'used' | 'cancelled' | 'transferred';
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketQRResult {
  registrationNumber: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  attendeeName: string;
  qrCodeDataURL: string;
  status: string;
  checkedInAt: string | null;
}
