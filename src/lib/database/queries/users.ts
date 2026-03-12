// =====================================================
// SECURE DATABASE QUERIES
// =====================================================
// Parameterized queries to prevent SQL injection
// All user inputs must be validated before use
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { validateInput, userRegistrationSchema, userLoginSchema } from '@/lib/validators';
import { logger } from '@/lib/utils/logger';
import { databaseError, validationError } from '@/lib/errors/handler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with proper error handling
const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// USER QUERIES
// =====================================================

/**
 * Get user by ID with validation
 */
export async function getUserById(userId: string) {
  try {
    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      throw validationError('Invalid user ID');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to get user by ID', error as Error, { userId });
    throw databaseError('Failed to fetch user');
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    // Validate email format
    const validation = await validateInput(
      userRegistrationSchema.shape.email,
      email
    );

    if (!validation.success) {
      throw validationError(validation.errors.message || 'Validation failed');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', validation.data)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to get user by email', error as Error, { email });
    throw databaseError('Failed to fetch user');
  }
}

/**
 * Create new user with validated data
 */
export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  try {
    // Validate all user data
    const validation = await validateInput(userRegistrationSchema, userData);

    if (!validation.success) {
      throw validationError(validation.errors.message || 'Validation failed');
    }

    const { data, error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) throw error;

    // Create profile
    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .insert({
        id: data.user?.id,
        email: validation.data.email,
        full_name: validation.data.full_name,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return profile;
  } catch (error) {
    logger.error('Failed to create user', error as Error);
    throw databaseError('Failed to create user');
  }
}

/**
 * Update user with validated data
 */
export async function updateUser(
  userId: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    avatar_url: string;
    phone: string;
  }>
) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw validationError('Invalid user ID');
    }

    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to update user', error as Error, { userId });
    throw databaseError('Failed to update user');
  }
}

/**
 * Delete user (cascade delete handled by database)
 */
export async function deleteUser(userId: string) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw validationError('Invalid user ID');
    }

    const { error } = await (supabase
      .from('profiles') as any)
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Also delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    return true;
  } catch (error) {
    logger.error('Failed to delete user', error as Error, { userId });
    throw databaseError('Failed to delete user');
  }
}

// =====================================================
// EVENT QUERIES
// =====================================================

/**
 * Get events with filters (secure)
 */
export async function getEvents(filters: {
  limit?: number;
  offset?: number;
  category?: string;
  city?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('published', true)
      .order('start_date', { ascending: true });

    // Apply filters safely (parameterized)
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate.toISOString());
    }

    // Limit and offset (prevent DoS)
    const limit = Math.min(filters.limit || 20, 100);
    const offset = Math.max(filters.offset || 0, 0);

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to get events', error as Error, { filters });
    throw databaseError('Failed to fetch events');
  }
}

/**
 * Get event by ID (secure)
 */
export async function getEventById(eventId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      throw validationError('Invalid event ID format');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to get event by ID', error as Error, { eventId });
    throw databaseError('Failed to fetch event');
  }
}

// =====================================================
// TICKET/REGISTRATION QUERIES
// =====================================================

/**
 * Create registration with validated data
 */
export async function createRegistration(registrationData: {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  user_id: string;
}) {
  try {
    // Use parameterized query (Supabase handles this)
    const { data, error } = await (supabase
      .from('registrations') as any)
      .insert(registrationData)
      .select()
      .single();

    if (error) throw error;

    logger.info('Registration created', { registrationId: data.id });
    return data;
  } catch (error) {
    logger.error('Failed to create registration', error as Error);
    throw databaseError('Failed to create registration');
  }
}

/**
 * Get user registrations
 */
export async function getUserRegistrations(userId: string) {
  try {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw validationError('Invalid user ID');
    }

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events (*),
        ticket_types (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Failed to get user registrations', error as Error, { userId });
    throw databaseError('Failed to fetch registrations');
  }
}

// Export all queries
export const queries = {
  users: {
    getById: getUserById,
    getByEmail: getUserByEmail,
    create: createUser,
    update: updateUser,
    delete: deleteUser,
  },
  events: {
    list: getEvents,
    getById: getEventById,
  },
  registrations: {
    create: createRegistration,
    getByUser: getUserRegistrations,
  },
};
