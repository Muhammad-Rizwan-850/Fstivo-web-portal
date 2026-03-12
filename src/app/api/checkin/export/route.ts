import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*, user:users(*)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false });

    if (error) throw error;

    const csv = [
      ['Name', 'Email', 'Checked In', 'Check-in Time'].join(','),
      ...tickets.map((t: any) =>
        [
          t.user.full_name,
          t.user.email,
          t.checked_in ? 'Yes' : 'No',
          t.checked_in_at || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="checkin-${eventId}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
