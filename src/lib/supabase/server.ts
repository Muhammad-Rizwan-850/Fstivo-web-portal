// src/lib/supabase/server.ts
// Server-side Supabase client for Next.js 15 App Router

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { ExtendedDatabase } from '@/lib/types/database-additions';

// Create a singleton Supabase client for server-side operations
// Using 'any' type temporarily to bypass type checking for tables not defined in Database type
// TODO: Generate proper types using: npx supabase gen types typescript --local > src/types/supabase-generated.d.ts
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  ) as any; // Temporary: using 'any' to allow dynamic table access
}

// For client components and authenticated operations, use the SSR client
export async function createAuthenticatedClient() {
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Server actions can't set cookies directly
        },
        remove() {
          // Server actions can't remove cookies directly
        },
      },
    }
  ) as any; // Temporary: using 'any' to allow dynamic table access
}
