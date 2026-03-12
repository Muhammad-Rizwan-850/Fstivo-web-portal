// =====================================================
// EMAIL MARKETING CAMPAIGNS - SERVER ACTIONS
// =====================================================
// File: src/lib/actions/email-campaign-actions.ts
// Features: Templates, campaigns, A/B testing, automation
// =====================================================

'use server';

import { createServerClient } from '@/lib/supabase/secure-client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function createEmailTemplate(data: {
  name: string;
  description?: string;
  category: string;
  subject_line: string;
  preview_text?: string;
  html_content: string;
  json_content?: any;
  is_public?: boolean;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        ...data,
        created_by: user.id
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/email-templates');
    return { template };
  } catch (error) {
    logger.error('Failed to create email template', error as Error);
    return { error: 'Failed to create template' };
  }
}

export async function getEmailTemplates(filters?: {
  category?: string;
  is_public?: boolean;
}) {
  try {
    const supabase = await createServerClient();
    let query = supabase.from('email_templates').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    const { data: templates, error } = await query;

    if (error) return { error: error.message };
    return { templates };
  } catch (error) {
    logger.error('Failed to get email templates', error as Error);
    return { error: 'Failed to fetch templates' };
  }
}

// ============================================================================
// AUDIENCE SEGMENTS
// ============================================================================

export async function createAudienceSegment(
  eventId: string,
  name: string,
  description: string,
  criteria: any
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Calculate estimated size based on criteria
    const estimatedSize = 0;

    const { data: segment, error } = await supabase
      .from('audience_segments')
      .insert({
        event_id: eventId,
        created_by: user.id,
        name,
        description,
        criteria,
        estimated_size: estimatedSize
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath(`/events/${eventId}/campaigns`);
    return { segment };
  } catch (error) {
    logger.error('Failed to create audience segment', error as Error);
    return { error: 'Failed to create segment' };
  }
}

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

export async function createEmailCampaign(data: {
  event_id: string;
  template_id?: string;
  segment_id?: string;
  name: string;
  subject_line: string;
  preview_text?: string;
  html_content: string;
  scheduled_at?: string;
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', data.event_id)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        ...data,
        created_by: user.id,
        status: data.scheduled_at ? 'scheduled' : 'draft'
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath(`/events/${data.event_id}/campaigns`);
    return { campaign };
  } catch (error) {
    logger.error('Failed to create email campaign', error as Error);
    return { error: 'Failed to create campaign' };
  }
}

export async function sendCampaign(campaignId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*, events!inner(organizer_id)')
      .eq('id', campaignId)
      .single();

    if (!campaign || campaign.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return { error: 'Campaign already sent' };
    }

    // Update status to sending
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sending', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', campaignId);

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to send campaign', error as Error);
    return { error: 'Failed to send campaign' };
  }
}

export async function getCampaignAnalytics(campaignId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data: campaign, error } = await supabase
      .from('v_campaign_performance')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) return { error: error.message };
    return { campaign };
  } catch (error) {
    logger.error('Failed to get campaign analytics', error as Error);
    return { error: 'Failed to fetch analytics' };
  }
}

// ============================================================================
// A/B TESTING
// ============================================================================

export async function createABTest(
  campaignId: string,
  variants: Array<{
    variant_name: string;
    subject_line: string;
    preview_text?: string;
    html_content: string;
    recipient_percentage: number;
  }>
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*, events!inner(organizer_id)')
      .eq('id', campaignId)
      .single();

    if (!campaign || campaign.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data: tests, error } = await supabase
      .from('email_ab_tests')
      .insert(
        variants.map(v => ({
          campaign_id: campaignId,
          ...v
        }))
      )
      .select();

    if (error) return { error: error.message };
    return { tests };
  } catch (error) {
    logger.error('Failed to create A/B test', error as Error);
    return { error: 'Failed to create A/B test' };
  }
}

// ============================================================================
// AUTOMATED FOLLOW-UPS
// ============================================================================

export async function setupAutomatedFollowup(
  eventId: string,
  triggerType: string,
  triggerValue: number,
  templateId: string,
  subjectLine: string,
  htmlContent: string
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    const { data: followup, error } = await supabase
      .from('automated_followups')
      .insert({
        event_id: eventId,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        template_id: templateId,
        subject_line: subjectLine,
        html_content: htmlContent
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath(`/events/${eventId}/automations`);
    return { followup };
  } catch (error) {
    logger.error('Failed to setup automated followup', error as Error);
    return { error: 'Failed to setup automation' };
  }
}
