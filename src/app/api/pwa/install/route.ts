import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// POST: Track PWA installation
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    const {
      device_type,
      platform,
      browser
    } = await request.json()

    const { data, error } = await supabase
      .from('pwa_installs')
      .insert({
        user_id: user?.id,
        device_type,
        platform,
        browser
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ install: data })
  } catch (error: any) {
    logger.error('Error tracking install:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
