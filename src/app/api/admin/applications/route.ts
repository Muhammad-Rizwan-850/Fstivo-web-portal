import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// Helper function to check if user is admin
async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data && (data.admin_level === 'admin' || data.admin_level === 'super_admin')
}

// GET /api/admin/applications - List all applications (admin only)
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const adminCheck = await isAdmin(supabase, user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('user_role_assignments')
      .select(`
        *,
        role: user_roles(*),
        user: auth.users!left(id, email, raw_user_meta_data)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (role) {
      query = query.eq('role_id', role)
    }
    if (search) {
      // Search in user metadata (name, email)
      query = query.or(`user.email.ilike.%${search}%,user.raw_user_meta_data->>full_name.ilike.%${search}%`)
    }

    const { data: applications, error } = await query

    if (error) {
      logger.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('user_role_assignments')
      .select('status')

    const pending = stats?.filter((s: any) => s.status === 'pending').length || 0
    const approved = stats?.filter((s: any) => s.status === 'approved').length || 0
    const rejected = stats?.filter((s: any) => s.status === 'rejected').length || 0
    const underReview = stats?.filter((s: any) => s.status === 'under_review').length || 0

    return NextResponse.json({
      applications,
      statistics: {
        pending,
        approved,
        rejected,
        underReview,
      },
    })
  } catch (error) {
    logger.error('Error in admin applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
