// =====================================================
// SECURE SUPABASE CLIENT
// =====================================================
// Creates Supabase clients with proper configuration
// Validates environment variables
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import env from '@/lib/config/env-validation';

// Define Database type locally to avoid import issues
type Database = any;

// =====================================================
// CLIENT CREATION
// =====================================================

/**
 * Create Supabase client for server-side use
 * Uses service role key for elevated privileges
 */
export function createServerClient(): SupabaseClient<Database> {
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const client = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.debug('Server client created');
    return client;
  } catch (error) {
    logger.error('Failed to create server client', error as Error);
    throw new Error('Failed to create Supabase client');
  }
}

/**
 * Create Supabase client for client-side use
 * Uses anon key with RLS
 */
export function createClientClient(): SupabaseClient<Database> {
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const client = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    logger.debug('Client client created');
    return client;
  } catch (error) {
    logger.error('Failed to create client', error as Error);
    throw new Error('Failed to create Supabase client');
  }
}

/**
 * Create Supabase client for server actions
 * Uses service role key for elevated privileges
 */
export function createActionClient(): SupabaseClient<Database> {
  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const client = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    logger.debug('Action client created');
    return client;
  } catch (error) {
    logger.error('Failed to create action client', error as Error);
    throw new Error('Failed to create Supabase client');
  }
}

// =====================================================
// SINGLETON INSTANCES
// =====================================================

let serverClientInstance: SupabaseClient<Database> | null = null;

/**
 * Get singleton server client instance
 */
export function getServerClient(): SupabaseClient<Database> {
  if (!serverClientInstance) {
    serverClientInstance = createServerClient();
  }
  return serverClientInstance;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get current user from request
 */
export async function getCurrentUser() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error('Not authenticated');

    return user;
  } catch (error) {
    logger.error('Failed to get current user', error as Error);
    throw new Error('Authentication failed');
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile() {
  try {
    const user = await getCurrentUser();
    const supabase = createServerClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    if (!profile) throw new Error('Profile not found');

    return profile;
  } catch (error) {
    logger.error('Failed to get current user profile', error as Error);
    throw new Error('Failed to fetch profile');
  }
}

/**
 * Check if user has role
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile();
    return profile.role === role;
  } catch (error) {
    logger.error('Failed to check user role', error as Error);
    return false;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if user is organizer
 */
export async function isOrganizer(): Promise<boolean> {
  return hasRole('organizer');
}

// Export default client
export default {
  server: createServerClient,
  client: createClientClient,
  action: createActionClient,
  getServer: getServerClient,
  getCurrentUser,
  getCurrentUserProfile,
  hasRole,
  isAdmin,
  isOrganizer,
};
