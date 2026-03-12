/**
 * Admin API - User Management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/config'
import { isAdmin, updateUserStatus, logAdminActivity } from '@/lib/admin/adminAuth'
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('account_status', status)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return NextResponse.json({
      users: data || [],
      total: count || 0,
      page,
      limit
    })
  } catch (error: any) {
    logger.error('Admin users error:', error)
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
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 })
    }

    const result = await updateUserStatus(
      userId,
      action,
      user.id
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Admin user action error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
