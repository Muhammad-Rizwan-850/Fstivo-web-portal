import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { trustDevice, getTrustedDevices } from '@/lib/security/two-factor-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await getTrustedDevices(user.id);

    return NextResponse.json({ devices });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, deviceInfo } = body;

    const device = await trustDevice(user.id, deviceId, deviceInfo);

    return NextResponse.json({ device });
  } catch (error) {
    logger.error('Error trusting device:', error);
    return NextResponse.json(
      { error: 'Failed to trust device' },
      { status: 500 }
    );
  }
}
