import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET /api/roles/:id - Get specific role details with form schema
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { roleId } = await params

    // Fetch role details
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('name', roleId)
      .eq('is_active', true)
      .single()

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Fetch form schema if role requires detailed form
    let formSchema = null
    if (role.requires_detailed_form) {
      const { data: form, error: formError } = await supabase
        .from('role_application_forms')
        .select('*')
        .eq('role_id', role.id)
        .single()

      if (!formError && form) {
        formSchema = form
      }
    }

    return NextResponse.json({ role, formSchema })
  } catch (error) {
    logger.error('Error in role details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
