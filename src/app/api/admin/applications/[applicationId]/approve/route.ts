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

// POST /api/admin/applications/:id/approve - Approve application
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
    const { notes } = body

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
    if (application.status !== 'pending' && application.status !== 'under_review') {
      return NextResponse.json(
        { error: 'Application has already been processed' },
        { status: 400 }
      )
    }

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('user_role_assignments')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        notes: notes || application.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error approving application:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve application' },
        { status: 500 }
      )
    }

    // Log activity
    await (supabase as any).from('application_activity_log').insert({
      application_id: applicationId,
      action: 'approved',
      actor_id: user.id,
      actor_type: 'admin',
      details: {
        notes,
        previous_status: application.status,
      },
    })

    // TODO: Send email notification to user

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Application approved successfully',
    })
  } catch (error) {
    logger.error('Error in approve application API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
