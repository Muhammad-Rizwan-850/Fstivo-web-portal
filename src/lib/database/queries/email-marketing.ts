/**
 * Email Marketing Query Functions
 * Database queries for email campaigns, templates, and automation
 */

import { createClient } from '@/lib/auth/config'
import type {
  EmailTemplate,
  AudienceSegment,
  EmailCampaign,
  EmailTracking,
  EmailABTest,
  EmailAutomation,
  EmailQueue,
  EmailSuppression
} from '@/types/email-marketing'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function getEmailTemplates(userId: string, includePublic = true) {
  const supabase = await createClient()

  let query = supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (includePublic) {
    query = query.or(`created_by.eq.${userId},is_public.eq.true`)
  } else {
    query = query.eq('created_by', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as EmailTemplate[]
}

export async function getEmailTemplate(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) throw error
  return data as EmailTemplate
}

export async function createEmailTemplate(
  userId: string,
  templateData: {
    templateName: string
    templateType: string
    subjectLine: string
    previewText?: string
    htmlContent: string
    textContent?: string
    templateVariables?: Record<string, any>
    isPublic?: boolean
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_templates') as any)
    .insert({
      created_by: userId,
      template_name: templateData.templateName,
      template_type: templateData.templateType,
      subject_line: templateData.subjectLine,
      preview_text: templateData.previewText,
      html_content: templateData.htmlContent,
      text_content: templateData.textContent,
      template_variables: templateData.templateVariables as any,
      is_public: templateData.isPublic || false
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailTemplate
}

export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<EmailTemplate>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_templates') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data as EmailTemplate
}

export async function deleteEmailTemplate(templateId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId)

  if (error) throw error
}

export async function incrementTemplateUsage(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('increment_template_usage', {
    template_id: templateId
  } as any)

  if (error) throw error
  return data
}

// ============================================================================
// AUDIENCE SEGMENTS
// ============================================================================

export async function getAudienceSegments(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audience_segments')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AudienceSegment[]
}

export async function getAudienceSegment(segmentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audience_segments')
    .select('*')
    .eq('id', segmentId)
    .single()

  if (error) throw error
  return data as AudienceSegment
}

export async function createAudienceSegment(
  userId: string,
  segmentData: {
    segmentName: string
    description?: string
    segmentType: string
    filters: Record<string, any>
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('audience_segments') as any)
    .insert({
      created_by: userId,
      segment_name: segmentData.segmentName,
      description: segmentData.description,
      segment_type: segmentData.segmentType,
      filters: segmentData.filters as any
    })
    .select()
    .single()

  if (error) throw error
  return data as AudienceSegment
}

export async function calculateSegmentSize(segmentId: string) {
  const supabase = await createClient()

  const segment = await getAudienceSegment(segmentId)
  const filters = segment.filters as any

  // Build query based on filters
  let query = supabase.from('registrations').select('id', { count: 'exact' })

  if (filters.eventId) {
    query = query.eq('event_id', filters.eventId)
  }

  if (filters.ticketType) {
    query = query.eq('ticket_type_id', filters.ticketType)
  }

  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { count, error } = await query

  if (error) throw error

  // Update segment with actual size
  await (supabase
    .from('audience_segments') as any)
    .update({
      actual_size: count || 0,
      last_calculated: new Date().toISOString()
    })
    .eq('id', segmentId)

  return count || 0
}

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

export async function getEmailCampaigns(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as EmailCampaign[]
}

export async function getEmailCampaign(campaignId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) throw error
  return data as EmailCampaign
}

export async function createEmailCampaign(
  eventId: string,
  createdBy: string,
  campaignData: {
    name: string
    subjectLine: string
    previewText?: string
    htmlContent: string
    templateId?: string
    segmentId?: string
    scheduledAt?: Date
  }
) {
  const supabase = await createClient()

  // Calculate recipient count if segment provided
  let recipientCount = 0
  if (campaignData.segmentId) {
    const segment = await getAudienceSegment(campaignData.segmentId)
    recipientCount = segment.actual_size || segment.estimated_size || 0
  }

  const { data, error } = await (supabase
    .from('email_campaigns') as any)
    .insert({
      event_id: eventId,
      created_by: createdBy,
      template_id: campaignData.templateId,
      segment_id: campaignData.segmentId,
      name: campaignData.name,
      subject_line: campaignData.subjectLine,
      preview_text: campaignData.previewText,
      html_content: campaignData.htmlContent,
      scheduled_at: campaignData.scheduledAt?.toISOString(),
      recipient_count: recipientCount,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailCampaign
}

export async function updateEmailCampaign(
  campaignId: string,
  updates: Partial<EmailCampaign>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_campaigns') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId)
    .select()
    .single()

  if (error) throw error
  return data as EmailCampaign
}

export async function deleteEmailCampaign(campaignId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) throw error
}

export async function sendCampaign(campaignId: string) {
  const supabase = await createClient()

  // Update campaign status to sending
  await updateEmailCampaign(campaignId, {
    status: 'sending',
    sent_at: new Date().toISOString()
  })

  const campaign = await getEmailCampaign(campaignId)

  // Queue all emails
  const recipients = await getCampaignRecipients(campaignId)

  for (const recipient of recipients) {
    await queueEmail({
      campaignId,
      registrationId: recipient.registration_id,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      subjectLine: campaign.subject_line,
      htmlContent: campaign.html_content
    })
  }

  // Update campaign status
  await updateEmailCampaign(campaignId, {
    status: 'sent',
    sent_count: recipients.length
  })

  return { success: true, sentCount: recipients.length }
}

async function getCampaignRecipients(campaignId: string) {
  const supabase = await createClient()

  const campaign = await getEmailCampaign(campaignId)

  let query = supabase
    .from('registrations')
    .select('id, profile_id')
    .eq('event_id', campaign.event_id)
    .eq('status', 'confirmed')

  // Apply segment filters if provided
  if (campaign.segment_id) {
    const segment = await getAudienceSegment(campaign.segment_id)
    const filters = segment.filters as any

    if (filters.ticketType) {
      query = query.eq('ticket_type_id', filters.ticketType)
    }

    if (filters.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus)
    }
  }

  const { data } = await query

  // Get profile emails
  const registrationIds = (data as any)?.map((r: any) => r.id) || []
  const profiles = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('id', (data as any)?.map((r: any) => r.profile_id) || [])

  return (data as any)?.map((reg: any) => {
    const profile = (profiles.data as any)?.find((p: any) => p.id === reg.profile_id)
    return {
      registration_id: reg.id,
      email: profile?.email || '',
      name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
    }
  }).filter((r: any) => r.email) || []
}

// ============================================================================
// EMAIL TRACKING
// ============================================================================

export async function getEmailTracking(campaignId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_tracking')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as EmailTracking[]
}

export async function updateEmailTracking(
  trackingId: string,
  updates: {
    status?: string
    delivered_at?: string
    opened_at?: string
    clicked_at?: string
    bounced_at?: string
    bounce_reason?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_tracking') as any)
    .update(updates)
    .eq('id', trackingId)
    .select()
    .single()

  if (error) throw error
  return data as EmailTracking
}

export async function recordEmailOpen(trackingId: string) {
  const supabase = await createClient()

  await updateEmailTracking(trackingId, {
    status: 'opened',
    opened_at: new Date().toISOString()
  })

  // Update campaign opened count
  const tracking = await supabase
    .from('email_tracking')
    .select('campaign_id')
    .eq('id', trackingId)
    .single()

  if ((tracking.data as any)) {
    await supabase.rpc('increment_campaign_opens', {
      campaign_id: (tracking.data as any).campaign_id
    } as any)
  }
}

export async function recordEmailClick(trackingId: string) {
  const supabase = await createClient()

  await updateEmailTracking(trackingId, {
    status: 'clicked',
    clicked_at: new Date().toISOString()
  })

  // Update campaign clicked count
  const tracking = await supabase
    .from('email_tracking')
    .select('campaign_id')
    .eq('id', trackingId)
    .single()

  if ((tracking.data as any)) {
    await supabase.rpc('increment_campaign_clicks', {
      campaign_id: (tracking.data as any).campaign_id
    } as any)
  }
}

// ============================================================================
// EMAIL QUEUE
// ============================================================================

export async function queueEmail(queueData: {
  campaignId?: string
  automationId?: string
  registrationId: string
  recipientEmail: string
  recipientName?: string
  subjectLine: string
  htmlContent: string
  scheduledFor?: Date
  priority?: number
}) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_queue') as any)
    .insert({
      campaign_id: queueData.campaignId,
      automation_id: queueData.automationId,
      registration_id: queueData.registrationId,
      recipient_email: queueData.recipientEmail,
      subject_line: queueData.subjectLine,
      html_content: queueData.htmlContent,
      scheduled_for: queueData.scheduledFor?.toISOString() || new Date().toISOString(),
      priority: queueData.priority || 5,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailQueue
}

export async function getEmailQueue(status?: string, limit = 100) {
  const supabase = await createClient()

  let query = supabase
    .from('email_queue')
    .select('*')
    .order('scheduled_for', { ascending: true })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['pending', 'failed'])
  }

  const { data, error } = await query
  if (error) throw error
  return data as EmailQueue[]
}

export async function processEmailQueue(queueId: string) {
  const supabase = await createClient()

  // Update status to processing
  await (supabase
    .from('email_queue') as any)
    .update({
      status: 'processing',
      last_attempt_at: new Date().toISOString()
    })
    .eq('id', queueId)

  const queuedEmail = await supabase
    .from('email_queue')
    .select('*')
    .eq('id', queueId)
    .single()

  if (queuedEmail.error) throw queuedEmail.error
  const email = queuedEmail.data as EmailQueue

  try {
    // Send email using your email service (Resend, SendGrid, etc.)
    // This is a placeholder - implement your actual email sending logic
    // await sendEmail({ ... })

    // Mark as sent
    await (supabase
      .from('email_queue') as any)
      .update({
        status: 'sent',
        attempts: (email.attempts || 0) + 1
      })
      .eq('id', queueId)

    // Create tracking record
    if (email.campaign_id) {
      await (supabase
        .from('email_tracking') as any)
        .insert({
          campaign_id: email.campaign_id,
          registration_id: email.registration_id,
          recipient_email: email.recipient_email,
          sent_at: new Date().toISOString(),
          status: 'sent'
        })
    }

    return { success: true }
  } catch (error: any) {
    // Mark as failed
    await (supabase
      .from('email_queue') as any)
      .update({
        status: (email.attempts || 0) >= (email.max_attempts || 3) ? 'failed' : 'pending',
        attempts: (email.attempts || 0) + 1,
        error_message: error.message
      })
      .eq('id', queueId)

    return { success: false, error: error.message }
  }
}

// ============================================================================
// A/B TESTING
// ============================================================================

export async function createABTest(
  campaignId: string,
  testData: {
    variantName: string
    variantType: 'subject_line' | 'content' | 'send_time'
    subjectLine?: string
    htmlContent?: string
    sendTime?: Date
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_ab_tests') as any)
    .insert({
      campaign_id: campaignId,
      variant_name: testData.variantName,
      variant_type: testData.variantType,
      subject_line: testData.subjectLine,
      html_content: testData.htmlContent,
      send_time: testData.sendTime?.toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailABTest
}

export async function getABTestResults(campaignId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_ab_tests')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('open_rate', { ascending: false })

  if (error) throw error
  return data as EmailABTest[]
}

export async function declareABTestWinner(variantId: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('email_ab_tests') as any)
    .update({ is_winner: true })
    .eq('id', variantId)

  if (error) throw error
}

// ============================================================================
// EMAIL AUTOMATIONS
// ============================================================================

export async function getEmailAutomations(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_automations')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as EmailAutomation[]
}

export async function createEmailAutomation(
  userId: string,
  automationData: {
    automationName: string
    triggerType: 'registration' | 'payment' | 'check_in' | 'event_end' | 'custom'
    triggerConditions?: Record<string, any>
    steps: any[]
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_automations') as any)
    .insert({
      created_by: userId,
      automation_name: automationData.automationName,
      trigger_type: automationData.triggerType,
      trigger_conditions: automationData.triggerConditions as any,
      steps: automationData.steps
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailAutomation
}

export async function triggerAutomation(
  automationId: string,
  eventId: string,
  triggerType: string
) {
  const supabase = await createClient()

  // Call the database function to create follow-up emails
  const { data, error } = await supabase.rpc('trigger_automated_followup', {
    p_event_id: eventId,
    p_trigger_type: triggerType
  } as any)

  if (error) throw error
  return data
}

// ============================================================================
// EMAIL SUPPRESSION & UNSUBSCRIBES
// ============================================================================

export async function addToSuppressionList(
  emailAddress: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe' | 'manual',
  addedBy?: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('email_suppression_list') as any)
    .insert({
      email_address: emailAddress,
      reason,
      added_by: addedBy
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailSuppression
}

export async function isEmailSuppressed(emailAddress: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_suppression_list')
    .select('id')
    .eq('email_address', emailAddress)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

export async function recordUnsubscribe(
  registrationId: string,
  emailAddress: string,
  campaignId?: string,
  reason?: string
) {
  const supabase = await createClient()

  // Add to suppression list
  await addToSuppressionList(emailAddress, 'unsubscribe')

  // Log unsubscribe
  const { data, error } = await (supabase
    .from('unsubscribe_logs') as any)
    .insert({
      registration_id: registrationId,
      email_address: emailAddress,
      campaign_id: campaignId,
      unsubscribe_reason: reason
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// CAMPAIGN PERFORMANCE
// ============================================================================

export async function getCampaignPerformance(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_campaign_performance')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
