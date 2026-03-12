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

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*, audience:audiences(*)')
      .eq('id', id)
      .eq('organizer_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get recipients from audience
    const { data: recipients, error: recipientsError } = await supabase
      .from('audience_members')
      .select('user:users(*)')
      .eq('audience_id', campaign.audience_id);

    if (recipientsError) throw recipientsError;

    // Send emails (implement actual email sending)
    // This is a placeholder - integrate with your email service
    const sentCount = recipients?.length || 0;

    // Update campaign status
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: sentCount,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      campaign: data,
      sent_count: sentCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
