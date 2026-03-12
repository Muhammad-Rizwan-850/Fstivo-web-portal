// Email Marketing Types
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  subject_line: string;
  template_id: string;
  audience_id: string;
  segment_id?: string;
  event_id: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_for?: string;
  sent_at?: string;
  html_content: string;
  sent_count?: number;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  created_at: string;
  updated_at: string;
}

export interface EmailAudience {
  id: string;
  name: string;
  description: string;
  filters: Record<string, unknown>;
  count: number;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'promotional' | 'transactional' | 'notification';
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  filters: Record<string, any>;
  count: number;
  actual_size?: number;
  estimated_size?: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTracking {
  id: string;
  campaign_id: string;
  recipient_email: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  unsubscribed_at?: string;
  created_at: string;
}

export interface EmailABTest {
  id: string;
  campaign_id: string;
  test_name: string;
  variant_a: string;
  variant_b: string;
  winner?: 'a' | 'b';
  test_metric: 'open_rate' | 'click_rate' | 'conversion_rate';
  created_at: string;
  completed_at?: string;
}

export interface EmailAutomation {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailQueue {
  id: string;
  campaign_id: string;
  recipient_email: string;
  registration_id?: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  priority: number;
  attempts?: number;
  max_attempts?: number;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailLink {
  id: string;
  campaign_id: string;
  url: string;
  clicks: number;
  unique_clicks: number;
  created_at: string;
}

export interface UnsubscribeLog {
  id: string;
  email: string;
  campaign_id?: string;
  reason?: string;
  unsubscribed_at: string;
  created_at: string;
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: 'bounce' | 'complaint' | 'unsubscribe' | 'manual';
  suppressed_at: string;
  created_at: string;
}
