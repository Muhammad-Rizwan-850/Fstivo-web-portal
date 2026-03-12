import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement');

    const supabase = await createClient();
    let query = supabase
      .from('sponsored_events')
      .select('*, event:events(*), sponsor:users(*)')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('priority', { ascending: false });

    if (placement) {
      query = query.eq('placement', placement);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;

    return NextResponse.json({ sponsored_events: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sponsored events' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Calculate cost based on duration and placement
    const days = Math.ceil(
      (new Date(body.end_date).getTime() - new Date(body.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    
    const placementCost = {
      homepage_hero: 5000,
      search_top: 3000,
      category_featured: 2000,
      sidebar: 1000,
    };
    
    const cost = (placementCost[body.placement as keyof typeof placementCost] || 1000) * days;

    const { data, error } = await supabase
      .from('sponsored_events')
      .insert({
        ...body,
        sponsor_id: user.id,
        cost,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      sponsored_event: data,
      message: 'Sponsorship request submitted for approval',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create sponsored event' },
      { status: 500 }
    );
  }
}
