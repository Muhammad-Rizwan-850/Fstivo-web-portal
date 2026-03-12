import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('connections')
      .select('*, connected_user:users!connected_user_id(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ connections: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
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

    const { connected_user_id } = await req.json();

    if (!connected_user_id) {
      return NextResponse.json(
        { error: 'Connected user ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id: user.id,
        connected_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}
