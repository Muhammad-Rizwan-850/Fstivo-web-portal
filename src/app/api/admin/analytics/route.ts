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

// GET /api/admin/analytics - Get platform analytics (admin only)
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

    // Get statistics by status
    const { data: statusStats } = await supabase
      .from('user_role_assignments')
      .select('status')

    const pending = statusStats?.filter((s: any) => s.status === 'pending').length || 0
    const underReview = statusStats?.filter((s: any) => s.status === 'under_review').length || 0
    const approved = statusStats?.filter((s: any) => s.status === 'approved').length || 0
    const rejected = statusStats?.filter((s: any) => s.status === 'rejected').length || 0
    const changesRequested = statusStats?.filter((s: any) => s.status === 'changes_requested').length || 0

    // Get applications by role
    const { data: assignments } = await supabase
      .from('user_role_assignments')
      .select('role_id, status, role: user_roles(name, display_name)')

    const roleStats: any = {}
    assignments?.forEach((assignment: any) => {
      const roleName = assignment.role?.display_name || assignment.role?.name || 'Unknown'
      if (!roleStats[roleName]) {
        roleStats[roleName] = { total: 0, approved: 0, pending: 0, rejected: 0 }
      }
      roleStats[roleName].total++
      if (assignment.status === 'approved') roleStats[roleName].approved++
      if (assignment.status === 'pending' || assignment.status === 'under_review') roleStats[roleName].pending++
      if (assignment.status === 'rejected') roleStats[roleName].rejected++
    })

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('application_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get approval rate
    const totalProcessed = (approved + rejected)
    const approvalRate = totalProcessed > 0 ? (approved / totalProcessed) * 100 : 0

    // Get pending applications > 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: overdueApplications } = await supabase
      .from('user_role_assignments')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', fortyEightHoursAgo)

    const overdueCount = overdueApplications?.length || 0

    return NextResponse.json({
      overview: {
        totalApplications: statusStats?.length || 0,
        pending,
        underReview,
        approved,
        rejected,
        changesRequested,
        approvalRate: Math.round(approvalRate * 10) / 10,
        overdueCount,
      },
      byRole: roleStats,
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    logger.error('Error in admin analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
