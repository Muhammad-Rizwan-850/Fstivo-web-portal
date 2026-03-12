'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  audience_id: z.string().min(1),
});

export async function createCampaign(data: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validated = campaignSchema.parse(data);

  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .insert({
      ...validated,
      organizer_id: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/campaigns');
  return { success: true, campaign };
}

export async function sendCampaign(campaignId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get campaign
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*, audience:audiences(*)')
    .eq('id', campaignId)
    .eq('organizer_id', user.id)
    .single();

  if (!campaign) {
    return { error: 'Campaign not found' };
  }

  // Get recipients
  const { data: recipients } = await supabase
    .from('audience_members')
    .select('user:users(*)')
    .eq('audience_id', campaign.audience_id);

  const recipientCount = recipients?.length || 0;

  // Import email sending implementation
  const { sendBatchEmails } = await import('@/lib/email/send-batch');

  // Prepare email parameters
  const emailParams = recipients.map((r: { user: any; email?: string | null }) => ({
    to: r.user?.email || '',
    subject: campaign.subject,
    html: campaign.content,
  }));

  // Send emails in batches
  const result = await sendBatchEmails(emailParams);

  if (!result.success) {
    return { error: `Failed to send: ${result.errors.length} emails` };
  }

  // Update campaign with actual send results
  const { error } = await supabase
    .from('email_campaigns')
    .update({
      status: result.failed === 0 ? 'sent' : 'partial',
      sent_at: new Date().toISOString(),
      recipients_count: recipientCount,
      sent_count: result.sent,
      failed_count: result.failed,
    })
    .eq('id', campaignId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/campaigns');
  return { success: true, sent_count: recipientCount };
}

export async function deleteCampaign(campaignId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('organizer_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/campaigns');
  return { success: true };
}
