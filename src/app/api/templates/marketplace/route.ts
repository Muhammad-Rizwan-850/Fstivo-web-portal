import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const supabase = await createClient();
    let query = supabase
      .from('event_templates')
      .select('*, organizer:users(full_name, avatar_url)')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json({ templates: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch marketplace templates' },
      { status: 500 }
    );
  }
}
