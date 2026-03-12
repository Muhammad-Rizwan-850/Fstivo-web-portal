import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.admin_role) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get recent activity from admin_activity_log
    const { data: activities, error } = await supabase
      .from('admin_activity_log')
      .select(`
        id,
        action,
        target_type,
        details,
        created_at,
        admin:admin_id (
          id,
          user_profiles (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Failed to fetch admin activity:', error);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }

    // Transform the data
    const recentActivity = activities?.map((activity: any) => ({
      id: activity.id,
      type: activity.action as any,
      description: generateActivityDescription(activity),
      timestamp: activity.created_at,
      user: activity.admin?.user_profiles?.full_name || 'Unknown Admin',
    })) || [];

    return NextResponse.json(recentActivity);
  } catch (error) {
    logger.error('Admin activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateActivityDescription(activity: any): string {
  const { action, target_type, details } = activity;

  switch (action) {
    case 'user_suspended':
      return `Suspended user account`;
    case 'user_activated':
      return `Activated user account`;
    case 'event_approved':
      return `Approved event "${details?.event_title || 'Unknown'}"`;
    case 'event_rejected':
      return `Rejected event "${details?.event_title || 'Unknown'}"`;
    case 'user_registered':
      return `New user registration`;
    case 'event_created':
      return `New event created: "${details?.event_title || 'Unknown'}"`;
    case 'payment_processed':
      return `Payment processed: $${details?.amount || 0}`;
    default:
      return `${action.replace('_', ' ')}`;
  }
}