import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticket_ids, event_id } = await req.json();

    if (!ticket_ids || !Array.isArray(ticket_ids)) {
      return NextResponse.json(
        { error: 'Ticket IDs array required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .in('id', ticket_ids)
      .eq('event_id', event_id)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data.length,
      tickets: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Bulk check-in failed' },
      { status: 500 }
    );
  }
}
