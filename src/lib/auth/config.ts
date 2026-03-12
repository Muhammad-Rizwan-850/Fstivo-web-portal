import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

export const createClient = async () => {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null

  try {
    // cookies() throws when called outside a request scope — guard it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    cookieStore = await cookies()
  } catch (err) {
    cookieStore = null
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore?.get(name)?.value
          } catch (e) {
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore?.set({ name, value, ...options })
          } catch (error) {
            // Not fatal in non-request contexts — no-op
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore?.set({ name, value: '', ...options })
          } catch (error) {
            // no-op
          }
        },
      },
    }
  )
}

export const createClientForComponent = async () => {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null

  try {
    // cookies() may throw outside a request scope
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    cookieStore = await cookies()
  } catch (err) {
    cookieStore = null
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore?.get(name)?.value
          } catch (e) {
            return undefined
          }
        },
      },
    }
  )
}
