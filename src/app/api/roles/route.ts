import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// GET /api/roles - List all active roles
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Fetch all active roles
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      logger.error('Error fetching roles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ roles })
  } catch (error) {
    logger.error('Error in roles API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
