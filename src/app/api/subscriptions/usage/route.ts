import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    // Get usage stats
    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', user.id)
      .gte(
        'created_at',
        new Date(subscription.current_period_start).toISOString()
      );

    const { count: attendeesCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in(
        'event_id',
        await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', user.id)
          .then((res: any) => res.data?.map((e: any) => e.id) || [])
      );

    return NextResponse.json({
      subscription,
      usage: {
        events: {
          used: eventsCount || 0,
          limit: subscription.plan.max_events || Infinity,
          percentage:
            subscription.plan.max_events === -1
              ? 0
              : ((eventsCount || 0) / subscription.plan.max_events) * 100,
        },
        attendees: {
          used: attendeesCount || 0,
          limit: subscription.plan.max_attendees || Infinity,
          percentage:
            subscription.plan.max_attendees === -1
              ? 0
              : ((attendeesCount || 0) / subscription.plan.max_attendees) * 100,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
