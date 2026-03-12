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

// GET /api/admin/applications/:id - Get application details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
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

    // Fetch application with full details
    const { data: application, error } = await supabase
      .from('user_role_assignments')
      .select(`
        *,
        role: user_roles(*),
        user: auth.users!left(id, email, raw_user_meta_data, created_at)
      `)
      .eq('id', applicationId)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Fetch activity log
    const { data: activityLog } = await supabase
      .from('application_activity_log')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    // Fetch profile completion
    const { data: profileCompletion } = await supabase
      .from('user_profile_completion')
      .select('*')
      .eq('user_id', (application as any).user_id)
      .single()

    return NextResponse.json({
      application,
      activityLog: activityLog || [],
      profileCompletion,
    })
  } catch (error) {
    logger.error('Error in application details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
