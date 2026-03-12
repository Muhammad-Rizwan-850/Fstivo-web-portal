import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// POST /api/applications/submit - Submit new role application
export async function POST(request: Request) {
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

    const body = await request.json()
    const { roleId, formData, documents } = body

    // Validate required fields
    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    // Fetch role details
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user already has this role
    const { data: existingAssignment } = await supabase
      .from('user_role_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('role_id', roleId)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'You already have this role or have a pending application' },
        { status: 400 }
      )
    }

    // If role doesn't require approval, approve immediately
    const status = role.requires_approval ? 'pending' : 'approved'
    const approvedAt = status === 'approved' ? new Date().toISOString() : null
    const approvedBy = status === 'approved' ? user.id : null

    // Create role assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: user.id,
        role_id: roleId,
        status,
        application_data: formData || {},
        verification_documents: documents || [],
        requested_at: new Date().toISOString(),
        approved_at: approvedAt,
        approved_by: approvedBy,
        is_primary: false, // Will be updated later if needed
      })
      .select()
      .single()

    if (assignmentError) {
      logger.error('Error creating role assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Log activity
    await (supabase as any).from('application_activity_log').insert({
      application_id: assignment.id,
      action: status === 'approved' ? 'auto_approved' : 'submitted',
      actor_id: user.id,
      actor_type: 'user',
      details: {
        role_name: role.name,
        requires_approval: role.requires_approval,
      },
    })

    return NextResponse.json({
      success: true,
      assignment,
      message: status === 'approved'
        ? 'Role assigned successfully!'
        : 'Application submitted successfully! Please wait for admin approval.',
    })
  } catch (error) {
    logger.error('Error in application submission API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
