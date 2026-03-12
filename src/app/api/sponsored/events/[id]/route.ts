import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const { data, error } = await (supabase as any)
      .from('sponsored_events')
      .select('*, event:events(*), sponsor:users(*), analytics:sponsored_analytics(*)')
      .eq('id', resolvedParams.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Sponsored event not found' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { data, error } = await (supabase as any)
      .from('sponsored_events')
      .update(body)
      .eq('id', resolvedParams.id)
      .eq('sponsor_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update sponsored event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { error } = await (supabase as any)
      .from('sponsored_events')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('sponsor_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Sponsored event deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete sponsored event' },
      { status: 500 }
    );
  }
}
