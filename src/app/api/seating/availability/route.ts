import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');
    const sectionId = searchParams.get('section_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from('seats')
      .select('*, section:seating_sections(*)')
      .eq('event_id', eventId);

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by status
    const availability = {
      total: data.length,
      available: data.filter((s: any) => s.status === 'available').length,
      reserved: data.filter((s: any) => s.status === 'reserved').length,
      sold: data.filter((s: any) => s.status === 'sold').length,
      blocked: data.filter((s: any) => s.status === 'blocked').length,
      seats: data,
    };

    return NextResponse.json(availability);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
