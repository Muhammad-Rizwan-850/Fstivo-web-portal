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

// POST /api/admin/applications/:id/request-changes - Request changes to application
export async function POST(
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
    const body = await request.json()
    const { changes } = body

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { error: 'Changes list is required' },
        { status: 400 }
      )
    }

    // Fetch current application
    const { data: application, error: fetchError } = await supabase
      .from('user_role_assignments')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is already processed
    if (application.status === 'approved' || application.status === 'rejected') {
      return NextResponse.json(
        { error: 'Cannot request changes on processed application' },
        { status: 400 }
      )
    }

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('user_role_assignments')
      .update({
        status: 'changes_requested',
        notes: `Changes requested: ${changes.join(', ')}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error requesting changes:', updateError)
      return NextResponse.json(
        { error: 'Failed to request changes' },
        { status: 500 }
      )
    }

    // Log activity
    await (supabase as any).from('application_activity_log').insert({
      application_id: applicationId,
      action: 'changes_requested',
      actor_id: user.id,
      actor_type: 'admin',
      details: {
        changes,
        previous_status: application.status,
      },
    })

    // TODO: Send email notification to user

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Changes requested successfully',
    })
  } catch (error) {
    logger.error('Error in request changes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
