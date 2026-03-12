import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const { data: placements, error } = await supabase
      .from('ad_placements')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ placements });
  } catch (error) {
    logger.error('Error fetching placements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch placements' },
      { status: 500 }
    );
  }
}
