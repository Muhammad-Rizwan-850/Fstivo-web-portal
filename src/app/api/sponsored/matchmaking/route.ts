import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id, budget, target_audience } = await req.json();

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find matching sponsors (simple matching logic)
    const { data: sponsors } = await supabase
      .from('sponsors')
      .select('*')
      .contains('categories', [event.category])
      .lte('min_budget', budget)
      .gte('max_budget', budget);

    // Calculate match scores (implement AI-based matching)
    const matches = sponsors?.map((sponsor: any) => ({
      ...sponsor,
      match_score: Math.random() * 100, // Replace with actual AI scoring
      reasons: ['Category match', 'Budget fit', 'Target audience alignment'],
    })) || [];

    return NextResponse.json({
      matches: matches.sort((a: any, b: any) => b.match_score - a.match_score),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Matchmaking failed' },
      { status: 500 }
    );
  }
}
