import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET - Get showcase statistics
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts for each section
    const [
      { count: eventsTotal },
      { count: eventsPublished },
      { count: eventsPending },
      { count: sponsorsTotal },
      { count: sponsorsActive },
      { count: sponsorsPending },
      { count: teamTotal },
      { count: teamActive },
      { count: volunteersTotal },
      { count: volunteersActive },
      { count: partnersTotal },
      { count: partnersActive },
      { count: partnersPending },
      { count: universitiesTotal },
      { count: universitiesActive },
      { count: universitiesPending }
    ] = await Promise.all([
      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }),
      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      (supabase as any).from('past_events_showcase').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }),
      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      (supabase as any).from('sponsors').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase as any).from('team_members').select('*', { count: 'exact', head: true }),
      (supabase as any).from('team_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      (supabase as any).from('volunteers').select('*', { count: 'exact', head: true }),
      (supabase as any).from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }),
      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
      (supabase as any).from('community_partners').select('*', { count: 'exact', head: true }).eq('is_active', false),
      (supabase as any).from('universities').select('*', { count: 'exact', head: true }),
      (supabase as any).from('universities').select('*', { count: 'exact', head: true }).eq('is_active', true),
      (supabase as any).from('universities').select('*', { count: 'exact', head: true }).eq('is_active', false)
    ]);

    const stats = {
      events: {
        total: eventsTotal || 0,
        active: eventsPublished || 0,
        pending: eventsPending || 0
      },
      sponsors: {
        total: sponsorsTotal || 0,
        active: sponsorsActive || 0,
        pending: sponsorsPending || 0
      },
      team: {
        total: teamTotal || 0,
        active: teamActive || 0,
        pending: 0
      },
      volunteers: {
        total: volunteersTotal || 0,
        active: volunteersActive || 0,
        pending: 0
      },
      partners: {
        total: partnersTotal || 0,
        active: partnersActive || 0,
        pending: partnersPending || 0
      },
      universities: {
        total: universitiesTotal || 0,
        active: universitiesActive || 0,
        pending: universitiesPending || 0
      }
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    logger.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
