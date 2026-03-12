import { nanoid } from 'nanoid';

export const mockUser = {
  id: nanoid(),
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'attendee' as const,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockOrganizer = {
  ...mockUser,
  id: nanoid(),
  email: 'organizer@example.com',
  full_name: 'Test Organizer',
  role: 'organizer' as const,
};

export const mockEvent = {
  id: nanoid(),
  title: 'Test Event',
  description: 'This is a test event description',
  category: 'conference',
  start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
  location: 'Lahore, Pakistan',
  organizer_id: mockOrganizer.id,
  status: 'published' as const,
  capacity: 100,
  banner_url: 'https://images.unsplash.com/photo-1',
  is_featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockTicket = {
  id: nanoid(),
  user_id: mockUser.id,
  event_id: mockEvent.id,
  tier_id: nanoid(),
  order_id: nanoid(),
  seat_id: null,
  qr_code: nanoid(),
  status: 'active' as const,
  checked_in: false,
  checked_in_at: null,
  checked_in_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
