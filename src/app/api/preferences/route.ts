import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET: Get user preferences
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error

    // Return defaults if no preferences
    if (!data) {
      return NextResponse.json({
        preferences: {
          theme: 'system',
          color_scheme: 'default',
          font_size: 'medium',
          language: 'en',
          timezone: 'Asia/Karachi',
          email_frequency: 'all',
          show_tutorial: true,
          enable_animations: true
        }
      })
    }

    return NextResponse.json({ preferences: data })
  } catch (error: any) {
    logger.error('Error fetching preferences:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Update user preferences
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await request.json()

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preferences: data })
  } catch (error: any) {
    logger.error('Error updating preferences:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
