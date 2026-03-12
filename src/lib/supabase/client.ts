/**
 * Supabase Client Configuration
 * Browser and Server-side clients with optimal settings
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger';
// Types temporarily removed - using 'any' to bypass type checking
// TODO: Generate proper types using: npx supabase gen types typescript --local > src/types/supabase-generated.d.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase environment variables not set. Some features may not work.')
}

/**
 * Browser client with real-time enabled
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'fstivo-web',
        },
      },
    })
  : null

/**
 * Service role client for server-side operations
 * WARNING: Only use in API routes or server actions!
 * Bypasses RLS - use with extreme caution
 */
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id'))
}

/**
 * Get Supabase URL (useful for constructing links)
 */
export const getSupabaseUrl = (): string => {
  return supabaseUrl || ''
}

/**
 * Get storage bucket URL
 */
export const getStorageUrl = (path: string): string => {
  const baseUrl = supabaseUrl || ''
  return `${baseUrl}/storage/v1/object/public/${path}`
}

export default supabase
