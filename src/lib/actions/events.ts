'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { EventDiscoveryItem } from '@/lib/types';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(50).max(5000),
  category: z.enum(['conference', 'concert', 'workshop', 'sports', 'exhibition', 'networking', 'charity', 'festival', 'other']),
  start_date: z.string(),
  end_date: z.string(),
  venue_type: z.enum(['physical', 'virtual', 'hybrid']),
  venue_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  capacity: z.number().min(1).optional(),
  virtual_meeting_link: z.string().url().optional(),
  image_url: z.string().url().optional(),
  is_published: z.boolean().default(false),
});

// =====================================================
// EVENT ACTIONS
// =====================================================

export async function createEvent(data: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = eventSchema.parse(data);

  // Generate slug from title
  const slug = validated.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...validated,
      slug,
      organizer_id: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function updateEvent(eventId: string, data: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = eventSchema.partial().parse(data);

  // Update slug if title changed
  let updateData: any = { ...validated };
  if (validated.title) {
    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    updateData = { ...updateData, slug };
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({
      ...(updateData as any),
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/events/' + event.slug);
  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Soft delete
  const { error } = await supabase
    .from('events')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'cancelled' 
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function publishEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({ 
      status: 'published',
      published_at: new Date().toISOString() 
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/events/' + event.slug);
  revalidatePath('/dashboard/my-events');
  return { success: true, event };
}

export async function unpublishEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .update({ status: 'draft' })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function duplicateEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get original event
  const { data: original, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (fetchError || !original) {
    return { error: 'Event not found' };
  }

  // Create duplicate
  const { id, created_at, updated_at, slug, ...eventData } = original;
  const newSlug = slug + '-copy';

  const { data: duplicate, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      title: original.title + ' (Copy)',
      slug: newSlug,
      organizer_id: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true, event: duplicate };
}

export async function addEventImage(eventId: string, imageUrl: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .update({ image_url: imageUrl })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/events/' + eventId);
  return { success: true };
}

export async function toggleFeatured(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get current status
  const { data: event } = await supabase
    .from('events')
    .select('is_featured')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  const { error } = await supabase
    .from('events')
    .update({ is_featured: !event.is_featured })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function updateEventStatus(eventId: string, status: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/my-events');
  return { success: true };
}

export async function addEventToWishlist(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('wishlists')
    .insert({
      user_id: user.id,
      event_id: eventId,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/events/' + eventId);
  return { success: true };
}

export async function removeEventFromWishlist(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/events/' + eventId);
  return { success: true };
}

export async function getEventById(eventId: string) {
  const supabase = createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*, organizer:users(*), tiers:ticket_tiers(*)')
    .eq('id', eventId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, event };
}

export async function getEventsByOrganizer() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { success: true, events };
}

// =====================================================
// PUBLIC EVENT FETCHING FUNCTIONS
// =====================================================

export async function fetchPublicEvents(filters?: {
  category?: string;
  field?: string;
  event_mode?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}) {
  // For now, return mock data since database might not be set up
  const mockEvents: EventDiscoveryItem[] = [
    {
      id: '1',
      title: 'Tech Summit 2024',
      description: 'Annual technology conference featuring the latest innovations',
      short_description: 'Annual tech conference',
      category: 'Technology',
      event_type: 'conference',
      status: 'published',
      category_id: 'technology',
      field_id: 'data-ai',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      location: { city: 'Lahore', address: 'Convention Center' },
      event_mode: 'in-person',
      venue_name: 'Convention Center',
      venue_city: 'Lahore',
      capacity: 500,
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      is_featured: true,
      price: 5000,
      currency: 'PKR',
      cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      banner_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      organizer_id: 'org_1',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Startup Pitch Night',
      description: 'Show your startup to investors and industry experts',
      short_description: 'Pitch your startup',
      category: 'Business',
      event_type: 'workshop',
      status: 'published',
      category_id: 'business',
      field_id: 'entrepreneurship',
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      location: { city: 'Karachi', address: 'Tech Hub' },
      event_mode: 'hybrid',
      venue_name: 'Tech Hub',
      venue_city: 'Karachi',
      capacity: 200,
      banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      is_featured: false,
      price: 1000,
      currency: 'PKR',
      cover_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      banner_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      organizer_id: 'org_2',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'AI Workshop Series',
      description: 'Learn about artificial intelligence and machine learning',
      short_description: 'AI/ML workshop',
      category: 'Technology',
      event_type: 'workshop',
      status: 'published',
      category_id: 'technology',
      field_id: 'data-ai',
      start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      location: undefined,
      event_mode: 'virtual',
      venue_name: undefined,
      venue_city: undefined,
      virtual_meeting_link: 'https://zoom.us/meeting/123',
      capacity: 100,
      banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
      is_featured: false,
      price: 2500,
      currency: 'PKR',
      cover_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      banner_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200',
      organizer_id: 'org_3',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: 'Digital Health Conference',
      description: 'Healthcare technology and medical innovations',
      short_description: 'Health tech event',
      category: 'Healthcare',
      event_type: 'conference',
      status: 'published',
      category_id: 'healthcare',
      field_id: 'health-tech',
      start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      location: { city: 'Islamabad', address: 'Medical Center' },
      event_mode: 'in-person',
      venue_name: 'Medical Center',
      venue_city: 'Islamabad',
      capacity: 500,
      banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
      is_featured: false,
      price: 4000,
      currency: 'PKR',
      cover_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      banner_image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200',
      organizer_id: 'org_4',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      title: 'Engineering Expo',
      description: 'Showcase of engineering projects and innovations',
      short_description: 'Engineering exhibition',
      category: 'Engineering',
      event_type: 'exhibition',
      status: 'published',
      category_id: 'engineering',
      field_id: 'mechanical-engineering',
      start_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
      location: { city: 'Lahore', address: 'Engineering University' },
      event_mode: 'in-person',
      venue_name: 'Engineering University',
      venue_city: 'Lahore',
      capacity: 800,
      banner_url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200',
      is_featured: false,
      price: 1500,
      currency: 'PKR',
      cover_image_url: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800',
      banner_image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200',
      organizer_id: 'org_5',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Apply filters (basic implementation)
  let filteredEvents = mockEvents;

  if (filters?.category) {
    filteredEvents = filteredEvents.filter(event => event.category_id === filters.category);
  }

  if (filters?.field) {
    filteredEvents = filteredEvents.filter(event => event.field_id === filters.field);
  }

  if (filters?.event_mode) {
    filteredEvents = filteredEvents.filter(event => event.event_mode === filters.event_mode);
  }

  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredEvents = filteredEvents.filter(event =>
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm)
    );
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 6;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  return {
    events: paginatedEvents,
    count: filteredEvents.length
  };
}

export async function fetchEventCategories() {
  // Return the static categories from the event-categories file
  const { EVENT_CATEGORIES } = await import('@/lib/event-categories');
  return EVENT_CATEGORIES;
}

// Alias for getEventById to match component expectations
export async function fetchEventById(eventId: string) {
  const result = await getEventById(eventId);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.event;
}

// Fetch event statistics
export async function fetchEventStats(eventId: string) {
  const supabase = createClient();
  
  // Get registration stats
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('status, payment_status, checked_in_at, total_amount')
    .eq('event_id', eventId);

  if (regError) {
    return { error: regError.message };
  }

  const totalRegistrations = registrations?.length || 0;
  const confirmedRegistrations = registrations?.filter((r: any) => r.status === 'confirmed').length || 0;
  const checkedInCount = registrations?.filter((r: any) => r.checked_in_at).length || 0;
  const totalRevenue = registrations?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0;

  return {
    totalRegistrations,
    confirmedRegistrations,
    checkedInCount,
    totalRevenue
  };
}

// Fetch event tickets/ticket types
export async function fetchEventTickets(eventId: string) {
  const supabase = createClient();
  
  const { data: tickets, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return tickets || [];
}

// Fetch event registrations
export async function fetchEventRegistrations(eventId: string) {
  const supabase = createClient();
  
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      *,
      user:profiles(*),
      ticket_type:ticket_types(*),
      attendees:registration_attendees(*)
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return registrations || [];
}

// Check-in related functions
export async function fetchCheckInStats(eventId: string) {
  const supabase = createClient();
  
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('status, checked_in_at')
    .eq('event_id', eventId);

  if (error) {
    throw new Error(error.message);
  }

  const total = registrations?.length || 0;
  const checkedIn = registrations?.filter((r: any) => r.checked_in_at).length || 0;
  const pending = total - checkedIn;

  return { total, checkedIn, pending };
}

export async function performCheckIn(registrationNumber: string) {
  const supabase = createClient();
  
  // Find the registration by number
  const { data: registration, error: findError } = await supabase
    .from('registrations')
    .select('*, attendees:registration_attendees(*)')
    .eq('registration_number', registrationNumber)
    .single();

  if (findError || !registration) {
    return { success: false, message: 'Registration not found' };
  }

  if (registration.checked_in_at) {
    return { success: false, message: 'Already checked in' };
  }

  // Update check-in status
  const { error: updateError } = await supabase
    .from('registrations')
    .update({ 
      checked_in_at: new Date().toISOString(),
      status: 'attended'
    })
    .eq('id', registration.id);

  if (updateError) {
    return { success: false, message: 'Failed to check in' };
  }

  return { 
    success: true, 
    message: 'Check-in successful',
    attendee: registration.attendees?.[0] || null
  };
}

export async function fetchEventAttendeesList(eventId: string) {
  const supabase = createClient();
  
  const { data: attendees, error } = await supabase
    .from('registration_attendees')
    .select(`
      *,
      registration:registrations(
        id,
        registration_number,
        status,
        checked_in_at,
        ticket_type:ticket_types(name, price)
      )
    `)
    .eq('registration.event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return attendees || [];
}

export async function searchEventAttendees(eventId: string, query: string) {
  const supabase = createClient();
  
  const { data: attendees, error } = await supabase
    .from('registration_attendees')
    .select(`
      *,
      registration:registrations(
        id,
        registration_number,
        status,
        checked_in_at,
        ticket_type:ticket_types(name, price)
      )
    `)
    .eq('registration.event_id', eventId)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return attendees || [];
}
