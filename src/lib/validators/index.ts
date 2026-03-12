import { z } from 'zod';

// =====================================================
// USER VALIDATORS
// =====================================================

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['attendee', 'organizer', 'volunteer', 'sponsor', 'admin', 'super_admin']).default('attendee'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// =====================================================
// VALIDATION UTILITIES
// =====================================================

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// =====================================================
// TICKET VALIDATORS
// =====================================================

export const ticketPurchaseSchema = z.object({
  tier_id: z.string().uuid('Invalid ticket tier ID'),
  quantity: z.number().min(1, 'Must purchase at least 1 ticket').max(10, 'Maximum 10 tickets per order'),
});

export const ticketTransferSchema = z.object({
  recipient_email: z.string().email('Invalid email address'),
  recipient_name: z.string().min(1, 'Recipient name is required'),
});

export const ticketCancelSchema = z.object({
  reason: z.string().optional(),
  refund_requested: z.boolean().default(false),
});

// =====================================================
// SOCIAL VALIDATORS
// =====================================================

export const connectionRequestSchema = z.object({
  connected_user_id: z.string().uuid('Invalid user ID'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

export const messageSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message must be less than 5000 characters'),
});

export const postSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(5000, 'Post must be less than 5000 characters'),
  images: z.array(z.string().url()).optional(),
  event_id: z.string().uuid().optional(),
});

// =====================================================
// CAMPAIGN VALIDATORS
// =====================================================

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject line is required'),
  preview_text: z.string().max(200, 'Preview text must be less than 200 characters').optional(),
  content: z.string().min(1, 'Email content is required'),
  audience_id: z.string().min(1, 'Please select an audience'),
  scheduled_for: z.string().optional(),
  send_immediately: z.boolean().default(false),
});

// =====================================================
// SEATING VALIDATORS
// =====================================================

export const venueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  description: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

export const seatingChartSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Chart name is required'),
  total_seats: z.number().min(1, 'Must have at least 1 seat'),
  sections: z.array(z.object({
    name: z.string().min(1, 'Section name is required'),
    rows: z.number().min(1, 'Must have at least 1 row'),
    seats_per_row: z.number().min(1, 'Must have at least 1 seat per row'),
    price_multiplier: z.number().min(0.5).max(5).default(1),
  })),
});

// =====================================================
// SUBSCRIPTION VALIDATORS
// =====================================================

export const subscriptionSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
  auto_renew: z.boolean().default(true),
});

// =====================================================
// ADVERTISING VALIDATORS
// =====================================================

export const adSchema = z.object({
  name: z.string().min(1, 'Ad name is required'),
  placement: z.enum(['homepage_banner', 'sidebar', 'feed_between', 'event_page_top'], {
    errorMap: () => ({ message: 'Invalid placement selected' }),
  }),
  creative_url: z.string().url('Invalid creative URL'),
  destination_url: z.string().url('Invalid destination URL'),
  daily_budget: z.number().min(100, 'Daily budget must be at least PKR 100'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  target_audience: z.object({
    categories: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    min_age: z.number().min(13).max(100).optional(),
    max_age: z.number().min(13).max(100).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

// =====================================================
// AFFILIATE VALIDATORS
// =====================================================

export const affiliateRegistrationSchema = z.object({
  payment_method: z.enum(['bank_transfer', 'jazzcash', 'easypaisa'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  payment_details: z.object({
    account_title: z.string().min(1, 'Account title is required'),
    account_number: z.string().min(1, 'Account number is required'),
    bank_name: z.string().optional(),
    cnic: z.string().regex(/^\d{13}$/, 'Invalid CNIC format').optional(),
  }),
  agree_to_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the affiliate terms' }),
  }),
});

export const affiliateLinkSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  custom_slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed').optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().min(1000, 'Minimum payout is PKR 1,000'),
  bank_details: z.object({
    account_title: z.string().min(1),
    account_number: z.string().min(1),
    bank_name: z.string().min(1),
  }).optional(),
});

// =====================================================
// EVENT VALIDATORS
// =====================================================

export const eventBasicInfoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  category: z.enum(['conference', 'concert', 'workshop', 'sports', 'exhibition', 'networking', 'charity', 'festival', 'other'], {
    errorMap: () => ({ message: 'Please select a category' }),
  }),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be less than 5000 characters'),
  venue_type: z.enum(['physical', 'virtual', 'hybrid']),
});

export const eventDetailsSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  timezone: z.string().default('Asia/Karachi'),
  is_recurring: z.boolean().default(false),
  recurring_pattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export const eventVenueSchema = z.object({
  venue_id: z.string().uuid().optional(),
  venue_name: z.string().min(1, 'Venue name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  capacity: z.number().min(1).optional(),
  virtual_meeting_link: z.string().url().optional(),
  virtual_meeting_platform: z.enum(['zoom', 'google_meet', 'teams', 'other']).optional(),
});

export const eventTicketTierSchema = z.object({
  tiers: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Tier name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    sale_start_date: z.string().optional(),
    sale_end_date: z.string().optional(),
    min_per_order: z.number().min(1).default(1),
    max_per_order: z.number().min(1).default(10),
  })).min(1, 'At least one ticket tier is required'),
});

export const eventImageSchema = z.object({
  cover_image: z.string().url().optional(),
  banner_image: z.string().url().optional(),
  gallery_images: z.array(z.string().url()).optional(),
});

export const eventSettingsSchema = z.object({
  is_published: z.boolean().default(false),
  allow_waitlist: z.boolean().default(false),
  max_attendees: z.number().min(1).optional(),
  require_approval: z.boolean().default(false),
  show_remaining_tickets: z.boolean().default(true),
  enable_feedback: z.boolean().default(true),
  enable_networking: z.boolean().default(true),
});

// =====================================================
// SPONSORED EVENTS VALIDATORS
// =====================================================

export const sponsoredEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  placement: z.enum(['homepage_hero', 'search_top', 'category_featured', 'sidebar'], {
    errorMap: () => ({ message: 'Invalid placement selected' }),
  }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

// =====================================================
// EXPORT ALL SCHEMAS
// =====================================================

export const schemas = {
  ticket: {
    purchase: ticketPurchaseSchema,
    transfer: ticketTransferSchema,
    cancel: ticketCancelSchema,
  },
  social: {
    connection: connectionRequestSchema,
    message: messageSchema,
    post: postSchema,
  },
  campaign: campaignSchema,
  seating: {
    venue: venueSchema,
    chart: seatingChartSchema,
  },
  subscription: subscriptionSchema,
  advertising: {
    ad: adSchema,
  },
  affiliate: {
    registration: affiliateRegistrationSchema,
    link: affiliateLinkSchema,
    payout: payoutRequestSchema,
  },
  event: {
    basicInfo: eventBasicInfoSchema,
    details: eventDetailsSchema,
    venue: eventVenueSchema,
    ticketTiers: eventTicketTierSchema,
    images: eventImageSchema,
    settings: eventSettingsSchema,
  },
  sponsored: {
    event: sponsoredEventSchema,
  },
};

export default schemas;
