import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'
import { logger } from '@/lib/logger';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export const createClient = () => {
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured. Returning null client.')
    return null
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
