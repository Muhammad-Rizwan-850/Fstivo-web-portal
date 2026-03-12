import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// POST: Subscribe to push notifications
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      endpoint,
      keys,
      device_type,
      browser
    } = await request.json()

    if (!endpoint || !keys) {
      return NextResponse.json({ error: 'endpoint and keys are required' }, { status: 400 })
    }

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('pwa_push_subscriptions')
      .select('*')
      .eq('endpoint', endpoint)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('pwa_push_subscriptions')
        .update({
          user_id: user.id,
          p256dh_key: keys.p256dh,
          auth_key: keys.auth,
          is_active: true,
          last_used_at: new Date().toISOString()
        })
        .eq('endpoint', endpoint)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ subscription: data })
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('pwa_push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh_key: keys.p256dh,
        auth_key: keys.auth,
        device_type,
        browser
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subscription: data })
  } catch (error: any) {
    logger.error('Error subscribing to push:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Unsubscribe from push notifications
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pwa_push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error unsubscribing:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
