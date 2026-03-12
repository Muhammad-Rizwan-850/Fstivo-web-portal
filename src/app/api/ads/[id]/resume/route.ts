import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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
    const { data, error } = await (supabase as any)
      .from('ads')
      .update({ status: 'active', paused_at: null })
      .eq('id', resolvedParams.id)
      .eq('advertiser_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ad: data, message: 'Ad resumed' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to resume ad' },
      { status: 500 }
    );
  }
}
