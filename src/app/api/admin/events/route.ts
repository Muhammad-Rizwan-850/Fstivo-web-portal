/**
 * Admin API - Event Moderation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { isAdmin, moderateEvent } from '@/lib/admin/adminAuth'
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isAdmin(user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.range(from, to)

    if (error) throw error

    return NextResponse.json({
      events: data || [],
      total: data?.length || 0,
      page
    })
  } catch (error: any) {
    logger.error('Admin events error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isAdmin(user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { eventId, action, reason } = body

    if (!eventId || !action) {
      return NextResponse.json({ error: 'eventId and action required' }, { status: 400 })
    }

    const result = await moderateEvent(
      eventId,
      action as 'approve' | 'reject',
      user.id,
      reason
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Admin event moderation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
