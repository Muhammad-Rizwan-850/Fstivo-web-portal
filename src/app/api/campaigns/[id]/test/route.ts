import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_email } = await req.json();

    if (!test_email) {
      return NextResponse.json(
        { error: 'Test email required' },
        { status: 400 }
      );
    }

    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single() as any;

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Send test email (implement email service)
    // await sendTestEmail(test_email, campaign);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${test_email}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
