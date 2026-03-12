# FSTIVO Organizer Tools - Complete Implementation Guide

## 📊 Executive Overview

This document provides comprehensive implementation details for three major organizer tool systems:

1. **Email Marketing Campaigns** ($7,000 value)
2. **Event Cloning & Templates** ($3,000 value)
3. **Seating & Venue Management** ($12,000 value)

**Total Value**: $22,000 | **Total Tables**: 30 | **Status**: Database Schemas Complete ✅

---

# SYSTEM 1: EMAIL MARKETING CAMPAIGNS

## Overview

A professional email marketing system with template builder, audience segmentation, A/B testing, and automation capabilities.

## Database Schema

### 10 Tables Created

#### 1. `email_templates`
Reusable email templates with variable support.

**Key Fields**:
- `id` (UUID, Primary Key)
- `organizer_id` (UUID, Foreign Key → auth.users)
- `event_id` (UUID, Optional, Foreign Key → events)
- `name`, `subject`, `preview_text`
- `html_content` (TEXT, Required)
- `json_design` (JSONB, For drag-and-drop builder)
- `category` (promotion, reminder, thank_you, follow_up)
- `is_public` (Boolean, Share in marketplace)
- `variables` (JSONB, Array of template variables)

**Indexes**:
- `idx_email_templates_organizer`
- `idx_email_templates_event`
- `idx_email_templates_category`

#### 2. `audience_segments`
Audience segmentation rules for targeted campaigns.

**Key Fields**:
- `id` (UUID, Primary Key)
- `organizer_id` (UUID, Foreign Key)
- `event_id` (UUID, Optional)
- `name`, `description`
- `criteria` (JSONB, Segment rules: ticket_type, location, age_range, etc.)
- `estimated_size` (Integer, Calculated)
- `last_calculated` (Timestamp)

**Example Criteria**:
```json
{
  "ticket_types": ["VIP", "General"],
  "location": ["Karachi", "Lahore"],
  "age_range": {"min": 18, "max": 35},
  "purchase_history": {"min_purchases": 2}
}
```

#### 3. `email_campaigns`
Main campaign management table.

**Key Fields**:
- `id`, `organizer_id`, `event_id`
- `name`, `campaign_type` (one_time, recurring, automated)
- `status` (draft, scheduled, sending, sent, paused, cancelled)
- `template_id`, `subject`, `from_name`, `from_email`, `reply_to`
- `segment_ids` (JSONB, Array of segment IDs)
- `total_recipients` (Integer)
- `send_at` (Timestamp with timezone)
- `timezone` (Varchar, Default: 'Asia/Karachi')
- `is_ab_test` (Boolean)
- `ab_test_config` (JSONB, A/B test configuration)
- **Metrics**: `sent_count`, `delivered_count`, `opened_count`, `clicked_count`, `bounced_count`, `unsubscribed_count`
- **Rates**: `delivery_rate`, `open_rate`, `click_rate`, `bounce_rate`
- **Revenue**: `revenue_generated`, `tickets_sold`

**A/B Test Config Example**:
```json
{
  "variants": ["A", "B"],
  "split_percentage": 50,
  "test_duration_hours": 24,
  "winner_criteria": "open_rate",
  "auto_send_winner": true
}
```

#### 4. `campaign_variants`
A/B test variants for campaigns.

**Key Fields**:
- `id`, `campaign_id` (Foreign Key → email_campaigns)
- `variant_name` (Varchar: "A", "B", "C")
- `subject`, `template_id`
- `percentage` (Integer, % of audience)
- **Performance**: `sent_count`, `opened_count`, `clicked_count`, `open_rate`, `click_rate`
- `is_winner` (Boolean)

#### 5. `campaign_sends`
Individual email tracking.

**Key Fields**:
- `id`, `campaign_id`, `variant_id`, `user_id`
- `recipient_email`, `recipient_name`
- `merge_fields` (JSONB, Personalization data)
- `status` (pending, sent, delivered, bounced, failed)
- **Timestamps**: `sent_at`, `delivered_at`, `opened_at`, `first_click_at`
- `open_count`, `click_count`
- `external_id` (Varchar, From email provider)
- `error_message`, `bounce_type` (hard, soft)

**Merge Fields Example**:
```json
{
  "first_name": "John",
  "event_name": "Tech Summit 2025",
  "event_date": "March 15, 2025",
  "ticket_url": "https://fstivo.com/events/123/tickets"
}
```

#### 6. `email_click_tracking`
Link-level click tracking.

**Key Fields**:
- `id`, `campaign_send_id` (Foreign Key → campaign_sends)
- `url` (Text)
- `clicked_at` (Timestamp)
- `user_agent`, `ip_address` (INET)
- `device_type` (desktop, mobile, tablet)

#### 7. `automated_campaigns`
Trigger-based automated campaigns.

**Key Fields**:
- `id`, `campaign_id` (Foreign Key → email_campaigns)
- `trigger_type` (ticket_purchase, event_reminder, post_event, abandoned_cart)
- `trigger_config` (JSONB, Delay and conditions)
- `is_active` (Boolean)
- `total_triggered`, `total_sent` (Integer)

**Trigger Config Examples**:
```json
// Event Reminder
{
  "delay": "24 hours",
  "delay_before": true,
  "conditions": {
    "ticket_status": "confirmed"
  }
}

// Post-Event Follow-up
{
  "delay": "48 hours",
  "delay_after": true,
  "conditions": {
    "attended": true
  }
}

// Abandoned Cart
{
  "delay": "2 hours",
  "conditions": {
    "cart_items_greater_than": 0
  }
}
```

#### 8. `automated_campaign_queue`
Queue for automated campaign sends.

**Key Fields**:
- `id`, `automated_campaign_id` (Foreign Key → automated_campaigns)
- `user_id` (Foreign Key → auth.users)
- `scheduled_for` (Timestamp with timezone)
- `status` (pending, sent, failed, cancelled)
- `trigger_data` (JSONB, Context from trigger)
- `sent_at`, `error_message`

#### 9. `email_unsubscribes`
Unsubscribe management.

**Key Fields**:
- `id`, `user_id`, `email`
- `campaign_id`, `organizer_id`, `event_id` (Foreign Keys)
- `unsubscribe_type` (all, event_specific, organizer_specific)
- `reason` (Varchar)
- `unsubscribed_at` (Timestamp)

**Unique Constraint**: `(email, unsubscribe_type, organizer_id, event_id)`

#### 10. `campaign_reports`
Daily performance reports.

**Key Fields**:
- `id`, `campaign_id` (Foreign Key → email_campaigns)
- `report_date` (Date)
- **Daily Metrics**: `sent_count`, `delivered_count`, `opened_count`, `clicked_count`, `bounced_count`
- `top_links` (JSONB, Array of clicked URLs)
- `engagement_by_hour` (JSONB, Hourly breakdown)

## Helper Functions

### 1. `calculate_segment_size(p_segment_id UUID) RETURNS INTEGER`
Calculates the estimated audience size for a segment.

```sql
SELECT calculate_segment_size('segment-uuid');
-- Returns: 1250
```

### 2. `update_campaign_metrics(p_campaign_id UUID) RETURNS void`
Updates all campaign performance metrics.

```sql
SELECT update_campaign_metrics('campaign-uuid');
```

**What it updates**:
- Sent, delivered, opened, clicked counts
- Bounce count
- Delivery rate, open rate, click rate, bounce rate
- Updated_at timestamp

### 3. `is_user_unsubscribed(p_email VARCHAR, p_organizer_id UUID, p_event_id UUID) RETURNS BOOLEAN`
Checks if a user has unsubscribed.

```sql
SELECT is_user_unsubscribed('user@example.com', 'org-uuid', 'event-uuid');
-- Returns: true or false
```

**Unsubscribe Logic**:
- Returns `true` if global unsubscribe (`unsubscribe_type = 'all'`)
- Returns `true` if organizer-specific unsubscribe
- Returns `true` if event-specific unsubscribe

## Service Layer Architecture

### EmailMarketingService Class

**File**: `src/lib/email-marketing/service.ts` (to be created)

```typescript
export class EmailMarketingService {
  // TEMPLATE MANAGEMENT
  async createTemplate(data: CreateTemplateDTO): Promise<Template>
  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<Template>
  async deleteTemplate(id: string): Promise<boolean>
  async getTemplate(id: string): Promise<Template | null>
  async listTemplates(organizerId: string, filters?: TemplateFilters): Promise<Template[]>

  // AUDIENCE SEGMENTS
  async createSegment(data: CreateSegmentDTO): Promise<Segment>
  async updateSegment(id: string, data: UpdateSegmentDTO): Promise<Segment>
  async calculateSegmentSize(id: string): Promise<number>
  async getSegmentMembers(id: string): Promise<User[]>

  // CAMPAIGN MANAGEMENT
  async createCampaign(data: CreateCampaignDTO): Promise<Campaign>
  async updateCampaign(id: string, data: UpdateCampaignDTO): Promise<Campaign>
  async deleteCampaign(id: string): Promise<boolean>
  async getCampaign(id: string): Promise<Campaign | null>
  async listCampaigns(organizerId: string, filters?: CampaignFilters): Promise<Campaign[]>

  // CAMPAIGN EXECUTION
  async scheduleCampaign(campaignId: string, sendAt: Date): Promise<boolean>
  async sendCampaign(campaignId: string): Promise<SendResults>
  async cancelCampaign(campaignId: string): Promise<boolean>
  async pauseCampaign(campaignId: string): Promise<boolean>
  async resumeCampaign(campaignId: string): Promise<boolean>

  // A/B TESTING
  async createABTest(campaignId: string, config: ABTestConfig): Promise<ABTest>
  async getABTestResults(campaignId: string): Promise<ABTestResults>
  async selectWinner(campaignId: string, variantId: string): Promise<boolean>

  // AUTOMATED CAMPAIGNS
  async createAutomatedCampaign(data: CreateAutomatedCampaignDTO): Promise<AutomatedCampaign>
  async triggerAutomatedCampaign(triggerType: string, triggerData: any): Promise<boolean>
  async processAutomatedQueue(): Promise<void>

  // ANALYTICS & REPORTING
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>
  async getCampaignReport(campaignId: string, date: Date): Promise<DailyReport>
  async getLinkClicks(campaignId: string, limit?: number): Promise<ClickStats[]>
  async getSubscriberEngagement(campaignId: string): Promise<EngagementStats[]>

  // UNSUBSCRIBE MANAGEMENT
  async unsubscribeUser(data: UnsubscribeDTO): Promise<boolean>
  async isUserUnsubscribed(email: string, organizerId: string, eventId?: string): Promise<boolean>
  async handleUnsubscribeClick(campaignSendId: string): Promise<boolean>
}
```

## API Routes

### Templates

#### `GET /api/email-marketing/templates`
List all templates for organizer.

**Query Params**:
- `organizerId` (string, required)
- `category` (string, optional)
- `isPublic` (boolean, optional)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Event Promotion",
      "subject": "Don't Miss {{event_name}}!",
      "category": "promotion",
      "variables": ["event_name", "event_date", "ticket_url"],
      "is_public": false
    }
  ]
}
```

#### `POST /api/email-marketing/templates`
Create new template.

**Body**:
```json
{
  "organizerId": "uuid",
  "name": "Summer Sale Template",
  "subject": "Summer Sale - {{discount}}% Off!",
  "htmlContent": "<html>...</html>",
  "category": "promotion",
  "variables": ["discount", "expiry_date"]
}
```

#### `PUT /api/email-marketing/templates/:id`
Update template.

#### `DELETE /api/email-marketing/templates/:id`
Delete template.

### Campaigns

#### `GET /api/email-marketing/campaigns`
List campaigns with filters.

**Query Params**:
- `organizerId` (string, required)
- `status` (string, optional)
- `campaignType` (string, optional)
- `limit` (number, default: 20)
- `offset` (number, default: 0)

#### `POST /api/email-marketing/campaigns`
Create new campaign.

**Body**:
```json
{
  "organizerId": "uuid",
  "eventId": "uuid",
  "name": "March Event Promotion",
  "campaignType": "one_time",
  "templateId": "uuid",
  "subject": "Join Us for Our March Event!",
  "segmentIds": ["segment-uuid-1", "segment-uuid-2"],
  "sendAt": "2025-03-01T10:00:00+05:00",
  "timezone": "Asia/Karachi",
  "isAbTest": true,
  "abTestConfig": {
    "variants": ["A", "B"],
    "splitPercentage": 50,
    "winnerCriteria": "open_rate"
  }
}
```

#### `POST /api/email-marketing/campaigns/:id/send`
Send campaign immediately.

#### `POST /api/email-marketing/campaigns/:id/schedule`
Schedule campaign for later.

#### `POST /api/email-marketing/campaigns/:id/cancel`
Cancel scheduled campaign.

#### `GET /api/email-marketing/campaigns/:id/analytics`
Get campaign analytics.

**Response**:
```json
{
  "success": true,
  "data": {
    "sentCount": 5000,
    "deliveredCount": 4850,
    "openedCount": 2425,
    "clickedCount": 970,
    "bouncedCount": 150,
    "deliveryRate": 97.0,
    "openRate": 50.0,
    "clickRate": 20.0,
    "bounceRate": 3.0,
    "revenueGenerated": 125000.00,
    "ticketsSold": 25
  }
}
```

### Segments

#### `GET /api/email-marketing/segments`
List all segments.

#### `POST /api/email-marketing/segments`
Create new segment.

**Body**:
```json
{
  "organizerId": "uuid",
  "eventId": "uuid",
  "name": "VIP Ticket Holders",
  "description": "Users who purchased VIP tickets",
  "criteria": {
    "ticket_types": ["VIP"],
    "purchase_date_after": "2025-01-01"
  }
}
```

#### `POST /api/email-marketing/segments/:id/calculate`
Calculate segment size.

### Automated Campaigns

#### `GET /api/email-marketing/automated`
List automated campaigns.

#### `POST /api/email-marketing/automated`
Create automated campaign.

**Body**:
```json
{
  "campaignId": "uuid",
  "triggerType": "event_reminder",
  "triggerConfig": {
    "delay": "24 hours",
    "delay_before": true
  }
}
```

### Unsubscribes

#### `POST /api/email-marketing/unsubscribe`
Unsubscribe user.

**Body**:
```json
{
  "email": "user@example.com",
  "campaignId": "uuid",
  "organizerId": "uuid",
  "eventId": "uuid",
  "unsubscribeType": "event_specific",
  "reason": "Not interested in this event"
}
```

#### `GET /api/email-marketing/unsubscribed/:email`
Check unsubscribe status.

## Integration with Third-Party Services

### Resend API Integration

**Environment Variables**:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@fstivo.com
RESEND_FROM_NAME=FSTIVO
```

**Service Implementation**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<{ id: string }> {
  const result = await resend.emails.send({
    from: from || process.env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  return { id: result.data?.id || '' };
}
```

## Usage Examples

### Example 1: Create and Send Campaign

```typescript
import { emailMarketingService } from '@/lib/email-marketing/service';

// 1. Create template
const template = await emailMarketingService.createTemplate({
  organizerId: 'org-uuid',
  name: 'Event Launch',
  subject: '{{event_name}} is Live! 🎉',
  htmlContent: '<html>...</html>',
  category: 'promotion',
  variables: ['event_name', 'event_date', 'ticket_url']
});

// 2. Create segment
const segment = await emailMarketingService.createSegment({
  organizerId: 'org-uuid',
  eventId: 'event-uuid',
  name: 'Past Attendees',
  criteria: {
    past_events_attended: { min: 1 }
  }
});

// 3. Create campaign
const campaign = await emailMarketingService.createCampaign({
  organizerId: 'org-uuid',
  eventId: 'event-uuid',
  name: 'March Event Launch',
  campaignType: 'one_time',
  templateId: template.id,
  subject: 'Tech Summit 2025 is Live! 🎉',
  segmentIds: [segment.id],
  sendAt: new Date('2025-03-01T10:00:00+05:00')
});

// 4. Send campaign
const results = await emailMarketingService.sendCampaign(campaign.id);

console.log(`Sent ${results.sentCount} emails`);
```

### Example 2: A/B Test Campaign

```typescript
// Create A/B test campaign
const campaign = await emailMarketingService.createCampaign({
  organizerId: 'org-uuid',
  name: 'Subject Line Test',
  campaignType: 'one_time',
  templateId: 'template-uuid',
  segmentIds: ['segment-uuid'],
  isAbTest: true,
  abTestConfig: {
    variants: [
      {
        name: 'A',
        subject: 'Don\'t Miss {{event_name}}!'
      },
      {
        name: 'B',
        subject: 'Last Chance for {{event_name}}'
      }
    ],
    splitPercentage: 50,
    winnerCriteria: 'open_rate',
    autoSendWinner: true
  }
});

// After 24 hours, get results
const results = await emailMarketingService.getABTestResults(campaign.id);
console.log('Variant A Open Rate:', results.variantA.openRate);
console.log('Variant B Open Rate:', results.variantB.openRate);

// Select winner manually (or auto-send if configured)
await emailMarketingService.selectWinner(campaign.id, results.winner);
```

### Example 3: Automated Event Reminder

```typescript
// Create automated reminder campaign
const automatedCampaign = await emailMarketingService.createAutomatedCampaign({
  campaignId: 'campaign-uuid',
  triggerType: 'event_reminder',
  triggerConfig: {
    delay: '24 hours',
    delay_before: true,
    conditions: {
      ticket_status: 'confirmed'
    }
  }
});

// Trigger when event is created (or scheduled job)
await emailMarketingService.triggerAutomatedCampaign(
  'event_reminder',
  {
    eventId: 'event-uuid',
    eventName: 'Tech Summit 2025',
    eventDate: '2025-03-15T10:00:00+05:00',
    userIds: ['user-1', 'user-2', 'user-3']
  }
);
```

---

# SYSTEM 2: EVENT CLONING & TEMPLATES

## Overview

Quickly create recurring events with templates, marketplace, and bulk operations.

## Database Schema

### 9 Tables Created

#### 1. `event_templates`
Reusable event templates.

**Key Fields**:
- `id` (UUID, Primary Key)
- `organizer_id` (UUID, Foreign Key → auth.users)
- `name`, `description`, `category`
- `thumbnail_url`
- `template_data` (JSONB, Complete event structure)
- `is_public`, `is_featured` (Boolean)
- `price` (Decimal, For paid templates)
- `downloads_count`, `rating`, `reviews_count`
- `tags` (JSONB, Searchable keywords)
- **Includes**: `includes_email_templates`, `includes_landing_page`, `includes_ticket_types`, `includes_schedule`, `includes_seating`

**Template Data Structure**:
```json
{
  "name": "Tech Conference [Year]",
  "description": "Annual tech conference",
  "category": "conference",
  "capacity": 500,
  "venue": {
    "name": "Convention Center",
    "address": "123 Main St"
  },
  "ticket_types": [
    {"name": "Early Bird", "price": 5000, "quantity": 100},
    {"name": "Regular", "price": 7500, "quantity": 300},
    {"name": "VIP", "price": 15000, "quantity": 100}
  ],
  "schedule": [
    {"day": 1, "sessions": [...]},
    {"day": 2, "sessions": [...]}
  ],
  "email_templates": ["confirmation", "reminder", "follow_up"],
  "seating": {
    "layout_id": "layout-uuid",
    "sections": [...]
  }
}
```

#### 2. `event_series`
Recurring event series.

**Key Fields**:
- `id`, `organizer_id`
- `name`, `description`
- `recurrence_pattern` (daily, weekly, monthly, yearly, custom)
- `recurrence_config` (JSONB, Recurrence rules)
- `base_template_id` (Foreign Key → event_templates)
- `base_event_data` (JSONB)
- `series_start_date`, `series_end_date` (Date)
- `total_events` (Integer)
- `is_active` (Boolean)

**Recurrence Config Examples**:
```json
// Weekly on Mondays and Wednesdays
{
  "frequency": "weekly",
  "interval": 1,
  "days_of_week": [1, 3],
  "end_date": "2025-12-31"
}

// Monthly on 15th
{
  "frequency": "monthly",
  "interval": 1,
  "day_of_month": 15,
  "end_after_occurrences": 12
}

// Custom: Every 2 weeks
{
  "frequency": "weekly",
  "interval": 2
}
```

#### 3. `series_events`
Individual events in a series.

**Key Fields**:
- `id`, `series_id` (Foreign Key → event_series)
- `event_id` (UUID, Unique, Foreign Key → events)
- `occurrence_number` (Integer)
- `scheduled_date` (Date)
- `status` (scheduled, created, cancelled, completed)
- `custom_data` (JSONB, Overrides)

#### 4. `template_purchases`
Marketplace purchase tracking.

**Key Fields**:
- `id`, `template_id`, `buyer_id` (Foreign Keys)
- `price_paid` (Decimal)
- `purchased_at` (Timestamp)

**Unique Constraint**: `(template_id, buyer_id)`

#### 5. `template_reviews`
Template ratings and reviews.

**Key Fields**:
- `id`, `template_id`, `reviewer_id` (Foreign Keys)
- `rating` (Integer, 1-5, CHECK constraint)
- `review_text` (Text)
- `helpful_count` (Integer)

**Unique Constraint**: `(template_id, reviewer_id)`

#### 6. `event_cloning_history`
Audit trail of cloning operations.

**Key Fields**:
- `id`, `organizer_id`
- `source_event_id`, `cloned_event_id` (UUIDs)
- `template_id` (Foreign Key → event_templates)
- `cloning_method` (direct_clone, from_template, from_series)
- `cloned_fields` (JSONB, List of copied fields)
- `modified_fields` (JSONB, Changed fields)
- `created_at` (Timestamp)

#### 7. `bulk_event_operations`
Batch operation tracking.

**Key Fields**:
- `id`, `organizer_id`
- `operation_type` (bulk_create, bulk_update, bulk_delete)
- `template_id`, `series_id` (Foreign Keys)
- `config` (JSONB, Operation details)
- `status` (pending, processing, completed, failed)
- `total_events`, `processed_events`, `failed_events` (Integer)
- `created_event_ids` (JSONB, Array of event IDs)
- `error_log` (JSONB, Array of errors)
- `started_at`, `completed_at`, `created_at` (Timestamps)

#### 8. `template_collections`
Template category collections.

**Key Fields**:
- `id`
- `name`, `description`
- `slug` (Varchar, Unique)
- `cover_image_url`, `icon`
- `display_order` (Integer)
- `is_active` (Boolean)

#### 9. `template_collection_items`
Collection-template mapping.

**Key Fields**:
- `id`, `collection_id`, `template_id` (Foreign Keys)
- `display_order` (Integer)

**Unique Constraint**: `(collection_id, template_id)`

## Helper Functions

### 1. `clone_event(p_source_event_id, p_organizer_id, p_new_event_data) RETURNS UUID`
Clone an existing event.

```sql
SELECT clone_event(
  'source-event-uuid',
  'organizer-uuid',
  '{"name": "Tech Conference 2025 (Copy)"}'::jsonb
);
-- Returns: new-event-uuid
```

**What it does**:
1. Copies all event data from source
2. Applies custom data overrides
3. Creates new event
4. Logs operation in `event_cloning_history`

### 2. `create_event_from_template(p_template_id, p_organizer_id, p_custom_data) RETURNS UUID`
Create event from template.

```sql
SELECT create_event_from_template(
  'template-uuid',
  'organizer-uuid',
  '{"name": "My Tech Conference", "start_date": "2025-06-01"}'::jsonb
);
-- Returns: new-event-uuid
```

**What it does**:
1. Retrieves template data
2. Merges with custom data
3. Creates new event from merged data
4. Increments template download count
5. Logs operation

### 3. `generate_series_events(p_series_id) RETURNS INTEGER`
Generate all events in a series.

```sql
SELECT generate_series_events('series-uuid');
-- Returns: 12 (created 12 events)
```

**What it does**:
1. Reads series recurrence pattern
2. Generates occurrences from start to end date
3. Creates `series_events` records
4. Updates `total_events` count
5. Returns number of events created

**Recurrence Support**:
- Daily
- Weekly
- Monthly
- Yearly
- Custom intervals

**Safety**: Max 100 events per series

## Service Layer Architecture

### EventCloningService Class

**File**: `src/lib/event-cloning/service.ts` (to be created)

```typescript
export class EventCloningService {
  // TEMPLATE MANAGEMENT
  async createTemplate(data: CreateTemplateDTO): Promise<EventTemplate>
  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<EventTemplate>
  async deleteTemplate(id: string): Promise<boolean>
  async getTemplate(id: string): Promise<EventTemplate | null>
  async listTemplates(filters?: TemplateFilters): Promise<EventTemplate[]>
  async searchTemplates(query: string, filters?: SearchFilters): Promise<EventTemplate[]>

  // MARKETPLACE
  async purchaseTemplate(templateId: string, buyerId: string): Promise<Purchase>
  async getFeaturedTemplates(): Promise<EventTemplate[]>
  async getPopularTemplates(): Promise<EventTemplate[]>
  async getTemplatesByCollection(slug: string): Promise<EventTemplate[]>

  // REVIEWS
  async createReview(data: CreateReviewDTO): Promise<Review>
  async updateReview(id: string, data: UpdateReviewDTO): Promise<Review>
  async deleteReview(id: string): Promise<boolean>
  async getTemplateReviews(templateId: string): Promise<Review[]>
  async markReviewHelpful(reviewId: string): Promise<boolean>

  // CLONING
  async cloneEvent(sourceEventId: string, organizerId: string, overrides?: any): Promise<Event>
  async createEventFromTemplate(templateId: string, organizerId: string, customData?: any): Promise<Event>
  async getCloningHistory(organizerId: string): Promise<CloningHistory[]>

  // SERIES MANAGEMENT
  async createSeries(data: CreateSeriesDTO): Promise<EventSeries>
  async updateSeries(id: string, data: UpdateSeriesDTO): Promise<EventSeries>
  async deleteSeries(id: string): Promise<boolean>
  async generateSeriesEvents(seriesId: string): Promise<number>
  async getSeries(id: string): Promise<EventSeries | null>
  async listSeries(organizerId: string): Promise<EventSeries[]>
  async cancelSeriesEvent(seriesEventId: string): Promise<boolean>
  async rescheduleSeriesEvent(seriesEventId: string, newDate: Date): Promise<boolean>

  // BULK OPERATIONS
  async createBulkEvents(data: BulkCreateDTO): Promise<BulkOperation>
  async updateBulkEvents(data: BulkUpdateDTO): Promise<BulkOperation>
  async deleteBulkEvents(eventIds: string[]): Promise<BulkOperation>
  async getBulkOperation(id: string): Promise<BulkOperation | null>
  async getBulkOperations(organizerId: string): Promise<BulkOperation[]>

  // COLLECTIONS
  async listCollections(): Promise<TemplateCollection[]>
  async getCollectionBySlug(slug: string): Promise<TemplateCollection | null>
  async createCollection(data: CreateCollectionDTO): Promise<TemplateCollection>
  async updateCollection(id: string, data: UpdateCollectionDTO): Promise<TemplateCollection>
  async deleteCollection(id: string): Promise<boolean>
}
```

## API Routes

### Templates

#### `GET /api/event-cloning/templates`
List templates with filters.

**Query Params**:
- `organizerId` (string, optional)
- `category` (string, optional)
- `isPublic` (boolean, default: true)
- `isFeatured` (boolean, optional)
- `search` (string, optional)
- `tags` (string[], optional)
- `minRating` (number, optional)
- `sortBy` (rating, downloads, created_at, default: created_at)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tech Conference Template",
      "description": "Complete tech conference setup",
      "category": "conference",
      "thumbnailUrl": "/templates/tech-conf.jpg",
      "isPublic": true,
      "isFeatured": true,
      "price": 0,
      "downloadsCount": 1250,
      "rating": 4.8,
      "reviewsCount": 42,
      "tags": ["technology", "conference", "networking"],
      "includes": {
        "emailTemplates": true,
        "landingPage": true,
        "ticketTypes": true,
        "schedule": true,
        "seating": false
      }
    }
  ]
}
```

#### `POST /api/event-cloning/templates`
Create new template from existing event.

**Body**:
```json
{
  "organizerId": "uuid",
  "sourceEventId": "event-uuid",
  "name": "My Event Template",
  "description": "Reusable template for similar events",
  "category": "workshop",
  "isPublic": true,
  "price": 2500,
  "tags": ["workshop", "training", "interactive"],
  "includes": {
    "emailTemplates": true,
    "ticketTypes": true,
    "schedule": false
  }
}
```

#### `GET /api/event-cloning/templates/:id`
Get template details with full data.

#### `PUT /api/event-cloning/templates/:id`
Update template metadata.

#### `DELETE /api/event-cloning/templates/:id`
Delete template (only if organizer owns it).

### Marketplace

#### `POST /api/event-cloning/templates/:id/purchase`
Purchase a paid template.

**Body**:
```json
{
  "buyerId": "uuid",
  "paymentMethodId": "pm_xxx"
}
```

#### `GET /api/event-cloning/marketplace/featured`
Get featured templates.

#### `GET /api/event-cloning/marketplace/collections/:slug`
Get templates by collection.

### Reviews

#### `POST /api/event-cloning/templates/:id/reviews`
Create review (must have purchased template).

**Body**:
```json
{
  "reviewerId": "uuid",
  "rating": 5,
  "reviewText": "Excellent template! Saved me hours of work."
}
```

#### `PUT /api/event-cloning/templates/:id/reviews/:reviewId`
Update own review.

#### `POST /api/event-cloning/reviews/:reviewId/helpful`
Mark review as helpful.

### Cloning

#### `POST /api/event-cloning/clone`
Clone existing event.

**Body**:
```json
{
  "sourceEventId": "event-uuid",
  "organizerId": "uuid",
  "overrides": {
    "name": "Tech Conference 2025 - Fall Edition",
    "startDate": "2025-09-15",
    "endDate": "2025-09-17"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "eventId": "new-event-uuid",
    "clonedFields": ["name", "description", "venue", "capacity", "ticketTypes"],
    "modifiedFields": ["name", "startDate", "endDate"]
  }
}
```

#### `POST /api/event-cloning/create-from-template`
Create event from template.

**Body**:
```json
{
  "templateId": "template-uuid",
  "organizerId": "uuid",
  "customData": {
    "name": "My Tech Summit 2025",
    "startDate": "2025-03-15",
    "capacity": 750
  }
}
```

### Series

#### `GET /api/event-cloning/series`
List all series for organizer.

#### `POST /api/event-cloning/series`
Create new series.

**Body**:
```json
{
  "organizerId": "uuid",
  "name": "Monthly Tech Meetups",
  "description": "Monthly technology networking events",
  "recurrencePattern": "monthly",
  "recurrenceConfig": {
    "frequency": "monthly",
    "interval": 1,
    "day_of_month": 15,
    "end_date": "2025-12-31"
  },
  "baseTemplateId": "template-uuid",
  "baseEventData": {
    "name": "Tech Meetup [Month]",
    "venue": "Tech Hub",
    "capacity": 100
  },
  "seriesStartDate": "2025-03-15",
  "seriesEndDate": "2025-12-15"
}
```

#### `POST /api/event-cloning/series/:id/generate`
Generate all events in series.

**Response**:
```json
{
  "success": true,
  "data": {
    "seriesId": "uuid",
    "eventsCreated": 10,
    "eventIds": ["event-1", "event-2", ...]
  }
}
```

#### `PUT /api/event-cloning/series/:id/events/:eventId`
Reschedule or cancel specific series event.

**Body**:
```json
{
  "action": "reschedule",
  "newDate": "2025-04-20",
  "customData": {
    "name": "Special April Meetup",
    "capacity": 150
  }
}
```

### Bulk Operations

#### `POST /api/event-cloning/bulk/create`
Bulk create events from template.

**Body**:
```json
{
  "organizerId": "uuid",
  "templateId": "uuid",
  "operationConfig": {
    "events": [
      {
        "name": "Event 1",
        "startDate": "2025-03-01",
        "overrides": {}
      },
      {
        "name": "Event 2",
        "startDate": "2025-04-01",
        "overrides": {}
      },
      {
        "name": "Event 3",
        "startDate": "2025-05-01",
        "overrides": {}
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "operationId": "uuid",
    "status": "processing",
    "totalEvents": 3
  }
}
```

#### `GET /api/event-cloning/bulk/operations/:id`
Get bulk operation status.

## Usage Examples

### Example 1: Create Template and Clone Event

```typescript
import { eventCloningService } from '@/lib/event-cloning/service';

// 1. Create template from existing event
const template = await eventCloningService.createTemplate({
  organizerId: 'org-uuid',
  sourceEventId: 'event-uuid',
  name: 'Music Festival Template',
  description: 'Complete music festival setup with stages, tickets, and vendors',
  category: 'concert',
  isPublic: true,
  price: 0,
  tags: ['music', 'festival', 'live', 'entertainment'],
  includes: {
    emailTemplates: true,
    ticketTypes: true,
    schedule: true,
    seating: false
  }
});

// 2. Clone event from template
const newEvent = await eventCloningService.createEventFromTemplate(
  template.id,
  'org-uuid',
  {
    name: 'Summer Music Festival 2025',
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    capacity: 5000
  }
);

console.log('Created event:', newEvent.id);
```

### Example 2: Create Recurring Event Series

```typescript
// 1. Create series
const series = await eventCloningService.createSeries({
  organizerId: 'org-uuid',
  name: 'Weekly Startup Pitch Nights',
  description: 'Weekly networking and pitch events for startups',
  recurrencePattern: 'weekly',
  recurrenceConfig: {
    frequency: 'weekly',
    interval: 1,
    days_of_week: [3], // Wednesday
    end_date: '2025-12-31'
  },
  baseEventData: {
    name: 'Startup Pitch Night',
    venue: 'Innovation Hub',
    capacity: 150,
    ticketTypes: [
      { name: 'General', price: 500, quantity: 120 },
      { name: 'Pitcher', price: 2000, quantity: 10 }
    ]
  },
  seriesStartDate: '2025-03-05',
  seriesEndDate: '2025-12-31'
});

// 2. Generate all series events
const eventsCreated = await eventCloningService.generateSeriesEvents(series.id);

console.log(`Generated ${eventsCreated} events`);

// 3. Modify specific occurrence
await eventCloningService.rescheduleSeriesEvent(
  'series-event-uuid',
  new Date('2025-12-24') // Skip Christmas week
);
```

### Example 3: Bulk Create Events

```typescript
// Bulk create 10 workshops
const bulkOperation = await eventCloningService.createBulkEvents({
  organizerId: 'org-uuid',
  templateId: 'workshop-template-uuid',
  operationConfig: {
    events: Array.from({ length: 10 }, (_, i) => ({
      name: `Workshop ${i + 1}: ${['AI', 'Blockchain', 'Cloud'][i % 3]} Fundamentals`,
      startDate: new Date(2025, 2, 1 + i * 7), // Weekly
      overrides: {
        capacity: 50,
        ticketTypes: [
          { name: 'Student', price: 1000, quantity: 30 },
          { name: 'Professional', price: 3000, quantity: 20 }
        ]
      }
    }))
  }
});

// Check progress
const status = await eventCloningService.getBulkOperation(bulkOperation.id);
console.log(`Processed ${status.processedEvents}/${status.totalEvents}`);
```

---

# SYSTEM 3: SEATING & VENUE MANAGEMENT

## Overview

Interactive seating chart builder with visual seat selection, section pricing, and accessibility features.

## Database Schema

### 11 Tables Created

#### 1. `venues`
Venue information and details.

**Key Fields**:
- `id` (UUID, Primary Key)
- `organizer_id` (UUID, Foreign Key → auth.users, nullable)
- `name`, `description`, `address`
- `city`, `country`, `postal_code`
- `latitude`, `longitude` (Decimal)
- `total_capacity`, `standing_capacity`, `seated_capacity` (Integer)
- **Amenities**: `has_parking`, `has_wheelchair_access`, `has_wifi`, `has_air_conditioning`, `amenities` (JSONB)
- `photos` (JSONB, Array of photo URLs)
- `floor_plan_url` (Text)
- `is_public` (Boolean)

#### 2. `venue_layouts`
Different seating configurations for venues.

**Key Fields**:
- `id`, `venue_id` (Foreign Key → venues)
- `name`, `description`
- `layout_type` (theater, stadium, classroom, banquet, custom)
- `canvas_width`, `canvas_height` (Integer, pixels)
- `layout_data` (JSONB, Complete seating structure)
- `total_sections`, `total_seats` (Integer)
- `is_default` (Boolean)

**Layout Data Structure**:
```json
{
  "canvas": {
    "width": 1000,
    "height": 800,
    "backgroundColor": "#f5f5f5"
  },
  "sections": [
    {
      "id": "section-uuid",
      "name": "VIP Section",
      "x": 100,
      "y": 50,
      "width": 800,
      "height": 200,
      "rotation": 0,
      "color": "#FFD700",
      "rows": [
        {
          "id": "row-uuid",
          "label": "A",
          "y": 20,
          "seats": [
            {"id": "seat-1", "number": "1", "x": 10, "type": "standard"},
            {"id": "seat-2", "number": "2", "x": 50, "type": "standard"}
          ]
        }
      ]
    }
  ]
}
```

#### 3. `seating_sections`
Major sections within layouts.

**Key Fields**:
- `id`, `layout_id` (Foreign Key → venue_layouts)
- `name`, `code` (e.g., "VIP", "A", "B")
- `description`
- `base_price` (Decimal)
- `price_modifier` (Decimal, Multiplier for dynamic pricing)
- `total_seats`, `available_seats` (Integer)
- **Visual**: `color`, `position_x`, `position_y`, `width`, `height`, `rotation`
- **Flags**: `is_vip`, `is_wheelchair_accessible`, `requires_approval`
- `display_order` (Integer)

#### 4. `seating_rows`
Rows within sections.

**Key Fields**:
- `id`, `section_id` (Foreign Key → seating_sections)
- `row_label` (Varchar: "A", "1", "AA")
- `row_number` (Integer)
- `total_seats` (Integer)
- `position_x`, `position_y` (Integer)
- `is_aisle` (Boolean)

#### 5. `seats`
Individual seats.

**Key Fields**:
- `id`, `row_id`, `section_id` (Foreign Keys)
- `seat_number` (Varchar: "1", "2", "101")
- `full_seat_label` (Varchar: "Section A, Row 5, Seat 12")
- `position_x`, `position_y` (Integer)
- `seat_type` (standard, wheelchair, companion, aisle)
- `is_accessible`, `has_restricted_view` (Boolean)
- `size` (Integer, pixels)
- `rotation` (Decimal)

**Unique Constraint**: `(row_id, seat_number)`

#### 6. `event_seating_configs`
Event-specific seating configuration.

**Key Fields**:
- `id`, `event_id` (UUID, Unique)
- `layout_id` (Foreign Key → venue_layouts)
- `seating_mode` (reserved, general_admission, mixed)
- `allows_seat_selection` (Boolean)
- `pricing_strategy` (by_section, by_tier, dynamic)
- `seat_hold_duration` (Integer, seconds, default: 600)
- `accessible_seats_percentage` (Decimal, default: 2.0)

#### 7. `seat_reservations`
Seat availability and status.

**Key Fields**:
- `id`, `event_id`, `seat_id` (Foreign Keys)
- `user_id` (UUID, Foreign Key → auth.users, nullable)
- `ticket_id` (UUID, Foreign Key → tickets)
- `status` (available, held, reserved, sold)
- `held_until` (Timestamp with timezone)
- `held_by_session` (Varchar, for temporary holds)
- `price` (Decimal)
- `is_blocked` (Boolean)
- `block_reason` (Text)

**Unique Constraint**: `(event_id, seat_id)`

#### 8. `section_pricing_tiers`
Time-based pricing for sections.

**Key Fields**:
- `id`, `event_id`, `section_id` (Foreign Keys)
- `tier_name` (Varchar: "Early Bird", "Regular", "Last Minute")
- `price` (Decimal)
- `valid_from`, `valid_until` (Timestamp with timezone)
- `max_quantity` (Integer, optional)

**Unique Constraint**: `(event_id, section_id, tier_name)`

#### 9. `seat_groups`
Group booking seats.

**Key Fields**:
- `id`, `event_id` (Foreign Keys)
- `name` (Varchar)
- `seat_ids` (JSONB, Array of seat IDs)
- `total_price` (Decimal)
- `discount_percentage` (Decimal)
- `status` (available, held, booked)

#### 10. `accessibility_requests`
Special accommodation requests.

**Key Fields**:
- `id`, `event_id`, `user_id` (Foreign Keys)
- **Requirements**: `requires_wheelchair_space`, `requires_companion_seat`, `requires_aisle_seat`, `requires_front_row` (Boolean)
- `special_requirements` (Text)
- `assigned_seat_ids` (JSONB, Array of seat IDs)
- `status` (pending, assigned, confirmed)
- `organizer_notes` (Text)

#### 11. `seating_analytics`
Seating performance metrics.

**Key Fields**:
- `id`, `event_id` (Foreign Keys)
- `date` (Date)
- **Metrics**: `total_seats`, `sold_seats`, `held_seats`, `blocked_seats`, `available_seats` (Integer)
- `revenue_by_section` (JSONB)
- `most_selected_sections` (JSONB, Array)
- `accessible_seats_booked` (Integer)

**Unique Constraint**: `(event_id, date)`

## Helper Functions

### 1. `hold_seats(p_event_id, p_seat_ids, p_user_id, p_session_id, p_hold_duration) RETURNS TABLE`
Hold multiple seats temporarily.

```sql
SELECT * FROM hold_seats(
  'event-uuid',
  ARRAY['seat-1', 'seat-2', 'seat-3']::UUID[],
  'user-uuid',
  'session-abc123',
  600 -- 10 minutes
);
```

**Returns**:
- `success` (Boolean)
- `held_seats` (UUID[], Array of successfully held seats)
- `message` (Text)

**Behavior**:
- Attempts to hold all requested seats
- Only holds seats that are available or have expired holds
- Returns partial success if some seats unavailable
- Sets `held_until` to `now() + duration`

### 2. `release_expired_holds() RETURNS INTEGER`
Release all expired seat holds.

```sql
SELECT release_expired_holds();
-- Returns: 15 (released 15 holds)
```

**Behavior**:
- Finds all seats with status='held' and held_until < now()
- Sets status back to 'available'
- Clears user_id, held_until, held_by_session
- Returns count of released seats

**Usage**: Run periodically via cron/job scheduler

### 3. `get_available_seats_by_section(p_event_id) RETURNS TABLE`
Get seat availability by section.

```sql
SELECT * FROM get_available_seats_by_section('event-uuid');
```

**Returns**:
- `section_id` (UUID)
- `section_name` (Varchar)
- `total_seats` (Integer)
- `available_seats` (Integer)
- `base_price` (Decimal)

**Usage**: Display seat availability on frontend

### 4. `block_seats(p_event_id, p_seat_ids, p_reason) RETURNS INTEGER`
Block seats from being sold.

```sql
SELECT block_seats(
  'event-uuid',
  ARRAY['seat-1', 'seat-2']::UUID[],
  'Reserved for VIP guests'
);
-- Returns: 2 (blocked 2 seats)
```

**Behavior**:
- Sets `is_blocked = true`
- Keeps `status = 'available'` but prevents purchase
- Requires organizer permissions
- Used for VIP, staff, or special reservations

## Service Layer Architecture

### SeatingManagementService Class

**File**: `src/lib/seating/service.ts` (to be created)

```typescript
export class SeatingManagementService {
  // VENUE MANAGEMENT
  async createVenue(data: CreateVenueDTO): Promise<Venue>
  async updateVenue(id: string, data: UpdateVenueDTO): Promise<Venue>
  async deleteVenue(id: string): Promise<boolean>
  async getVenue(id: string): Promise<Venue | null>
  async listVenues(organizerId?: string, filters?: VenueFilters): Promise<Venue[]>

  // LAYOUT MANAGEMENT
  async createLayout(data: CreateLayoutDTO): Promise<VenueLayout>
  async updateLayout(id: string, data: UpdateLayoutDTO): Promise<VenueLayout>
  async deleteLayout(id: string): Promise<boolean>
  async getLayout(id: string): Promise<VenueLayout | null>
  async getVenueLayouts(venueId: string): Promise<VenueLayout[]>
  async setDefaultLayout(layoutId: string): Promise<boolean>

  // SECTION MANAGEMENT
  async createSection(data: CreateSectionDTO): Promise<SeatingSection>
  async updateSection(id: string, data: UpdateSectionDTO): Promise<SeatingSection>
  async deleteSection(id: string): Promise<boolean>
  async getSections(layoutId: string): Promise<SeatingSection[]>

  // ROW & SEAT MANAGEMENT
  async createRow(data: CreateRowDTO): Promise<SeatingRow>
  async createSeats(data: CreateSeatsDTO): Promise<Seat[]>
  async updateSeat(id: string, data: UpdateSeatDTO): Promise<Seat>
  async getSeats(sectionId: string): Promise<Seat[]>
  async getSeatDetails(seatId: string): Promise<Seat | null>

  // EVENT CONFIGURATION
  async configureEventSeating(data: EventSeatingConfigDTO): Promise<EventSeatingConfig>
  async getEventSeatingConfig(eventId: string): Promise<EventSeatingConfig | null>
  async updateEventSeatingConfig(eventId: string, data: UpdateConfigDTO): Promise<EventSeatingConfig>

  // SEAT SELECTION & RESERVATION
  async getAvailableSeats(eventId: string, filters?: SeatFilters): Promise<SeatAvailability[]>
  async holdSeats(eventId: string, seatIds: string[], userId: string, sessionId: string, duration?: number): Promise<HoldResult>
  async releaseHolds(sessionId: string): Promise<number>
  async reserveSeats(eventId: string, seatIds: string[], userId: string, ticketIds: string[]): Promise<Reservation>
  async purchaseReservedSeats(reservationId: string): Promise<boolean>
  async blockSeats(eventId: string, seatIds: string[], reason: string): Promise<number>
  async unblockSeats(eventId: string, seatIds: string[]): Promise<number>

  // PRICING
  async setSectionPricing(data: SectionPricingDTO[]): Promise<boolean>
  async getSectionPricing(eventId: string): Promise<SectionPricing[]>
  async getSeatPrice(eventId: string, seatId: string): Promise<SeatPrice>
  async updateSeatPrice(eventId: string, seatId: string, price: number): Promise<boolean>

  // GROUP BOOKINGS
  async createSeatGroup(data: CreateSeatGroupDTO): Promise<SeatGroup>
  async getSeatGroups(eventId: string): Promise<SeatGroup[]>
  async bookSeatGroup(groupId: string, userId: string): Promise<Reservation>

  // ACCESSIBILITY
  async submitAccessibilityRequest(data: AccessibilityRequestDTO): Promise<AccessibilityRequest>
  async getAccessibilityRequests(eventId: string): Promise<AccessibilityRequest[]>
  async assignAccessibleSeats(requestId: string, seatIds: string[]): Promise<boolean>
  async approveAccessibilityRequest(requestId: string, notes?: string): Promise<boolean>

  // ANALYTICS
  async getSeatingAnalytics(eventId: string, date?: Date): Promise<SeatingAnalytics>
  async getSectionPerformance(eventId: string): Promise<SectionPerformance[]>
  async getPopularSections(eventId: string, limit?: number): Promise<SectionStats[]>
  async generateSeatingReport(eventId: string, startDate: Date, endDate: Date): Promise<SeatingReport>

  // UTILITIES
  async releaseExpiredHolds(): Promise<number>
  async exportSeatingLayout(eventId: string): Promise<LayoutExport>
  async importSeatingLayout(layoutData: any, venueId: string): Promise<VenueLayout>
}
```

## API Routes

### Venues

#### `GET /api/seating/venues`
List venues with filters.

**Query Params**:
- `organizerId` (string, optional)
- `city` (string, optional)
- `isPublic` (boolean, default: true)
- `minCapacity` (number, optional)
- `hasWheelchairAccess` (boolean, optional)
- `hasParking` (boolean, optional)

#### `POST /api/seating/venues`
Create new venue.

**Body**:
```json
{
  "organizerId": "uuid",
  "name": "Karachi Expo Center",
  "description": "Premier exhibition and convention center",
  "address": "Main Stadium Road",
  "city": "Karachi",
  "country": "Pakistan",
  "postalCode": "75500",
  "latitude": 24.8607,
  "longitude": 67.0011,
  "totalCapacity": 5000,
  "seatedCapacity": 3000,
  "standingCapacity": 2000,
  "hasParking": true,
  "hasWheelchairAccess": true,
  "hasWifi": true,
  "hasAirConditioning": true,
  "photos": ["photo1.jpg", "photo2.jpg"],
  "isPublic": true
}
```

#### `PUT /api/seating/venues/:id`
Update venue details.

#### `GET /api/seating/venues/:id`
Get venue with layouts.

### Layouts

#### `GET /api/seating/venues/:venueId/layouts`
Get all layouts for a venue.

#### `POST /api/seating/layouts`
Create new layout.

**Body**:
```json
{
  "venueId": "uuid",
  "name": "Concert Configuration",
  "description": "Standard concert setup with VIP, General, and Balcony",
  "layoutType": "theater",
  "canvasWidth": 1200,
  "canvasHeight": 900,
  "layoutData": {
    "sections": [
      {
        "name": "VIP",
        "code": "VIP",
        "basePrice": 5000,
        "color": "#FFD700",
        "x": 100,
        "y": 50,
        "rows": 5,
        "seatsPerRow": 20
      },
      {
        "name": "General",
        "code": "GEN",
        "basePrice": 2000,
        "color": "#4CAF50",
        "x": 100,
        "y": 300,
        "rows": 10,
        "seatsPerRow": 30
      }
    ]
  }
}
```

#### `PUT /api/seating/layouts/:id`
Update layout.

#### `DELETE /api/seating/layouts/:id`
Delete layout.

### Event Configuration

#### `GET /api/seating/events/:eventId/config`
Get event seating configuration.

#### `POST /api/seating/events/:eventId/configure`
Configure seating for event.

**Body**:
```json
{
  "layoutId": "layout-uuid",
  "seatingMode": "reserved",
  "allowsSeatSelection": true,
  "pricingStrategy": "by_section",
  "seatHoldDuration": 600,
  "accessibleSeatsPercentage": 2.0
}
```

### Seat Selection

#### `GET /api/seating/events/:eventId/availability`
Get seat availability.

**Query Params**:
- `sectionId` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `seatType` (string, optional)
- `onlyAccessible` (boolean, optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "sectionId": "uuid",
        "sectionName": "VIP",
        "totalSeats": 100,
        "availableSeats": 45,
        "basePrice": 5000,
        "color": "#FFD700"
      }
    ],
    "seats": [
      {
        "seatId": "uuid",
        "sectionId": "uuid",
        "rowLabel": "A",
        "seatNumber": "12",
        "fullLabel": "VIP, Row A, Seat 12",
        "status": "available",
        "price": 5000,
        "position": {"x": 150, "y": 70},
        "type": "standard",
        "isAccessible": false
      }
    ]
  }
}
```

#### `POST /api/seating/events/:eventId/hold`
Hold seats temporarily.

**Body**:
```json
{
  "seatIds": ["seat-1", "seat-2", "seat-3"],
  "userId": "uuid",
  "sessionId": "session-abc123",
  "duration": 600
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "heldSeats": ["seat-1", "seat-2", "seat-3"],
    "message": "All seats held successfully",
    "heldUntil": "2025-03-01T10:10:00+05:00"
  }
}
```

#### `POST /api/seating/events/:eventId/reserve`
Reserve seats for purchase.

**Body**:
```json
{
  "seatIds": ["seat-1", "seat-2", "seat-3"],
  "userId": "uuid",
  "ticketIds": ["ticket-1", "ticket-2", "ticket-3"]
}
```

#### `POST /api/seating/events/:eventId/block`
Block seats (organizer only).

**Body**:
```json
{
  "seatIds": ["seat-1", "seat-2"],
  "reason": "Reserved for VIP guests"
}
```

### Accessibility

#### `POST /api/seating/events/:eventId/accessibility-requests`
Submit accessibility request.

**Body**:
```json
{
  "userId": "uuid",
  "requiresWheelchairSpace": true,
  "requiresCompanionSeat": true,
  "requiresAisleSeat": false,
  "requiresFrontRow": false,
  "specialRequirements": "Need space for service dog"
}
```

#### `GET /api/seating/events/:eventId/accessibility-requests`
List all accessibility requests (organizer only).

#### `PUT /api/seating/accessibility-requests/:id/assign`
Assign accessible seats.

**Body**:
```json
{
  "seatIds": ["accessible-seat-1", "accessible-seat-2"],
  "notes": "Assigned wheelchair space and companion seat"
}
```

### Analytics

#### `GET /api/seating/events/:eventId/analytics`
Get seating analytics.

**Query Params**:
- `startDate` (string, optional)
- `endDate` (string, optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSeats": 1000,
    "soldSeats": 750,
    "heldSeats": 25,
    "blockedSeats": 10,
    "availableSeats": 215,
    "revenueBySection": {
      "VIP": 250000,
      "General": 900000
    },
    "mostSelectedSections": [
      {"section": "VIP", "selections": 450},
      {"section": "General", "selections": 300}
    ],
    "accessibleSeatsBooked": 8
  }
}
```

## Usage Examples

### Example 1: Create Venue and Layout

```typescript
import { seatingService } from '@/lib/seating/service';

// 1. Create venue
const venue = await seatingService.createVenue({
  organizerId: 'org-uuid',
  name: 'Karachi Arts Council',
  description: 'Premier performing arts venue',
  address: '123 Arts Road',
  city: 'Karachi',
  country: 'Pakistan',
  totalCapacity: 1500,
  seatedCapacity: 1200,
  standingCapacity: 300,
  hasWheelchairAccess: true,
  hasParking: true,
  isPublic: true
});

// 2. Create layout
const layout = await seatingService.createLayout({
  venueId: venue.id,
  name: 'Standard Theater Setup',
  layoutType: 'theater',
  canvasWidth: 1000,
  canvasHeight: 800,
  layoutData: {
    sections: [
      {
        name: 'Orchestra',
        code: 'ORCH',
        basePrice: 5000,
        color: '#E91E63',
        x: 100,
        y: 50,
        width: 800,
        height: 200,
        rows: 10,
        seatsPerRow: 20
      },
      {
        name: 'Balcony',
        code: 'BALC',
        basePrice: 3000,
        color: '#9C27B0',
        x: 100,
        y: 300,
        width: 800,
        height: 200,
        rows: 8,
        seatsPerRow: 25
      }
    ]
  }
});

console.log(`Created venue with ${layout.totalSeats} seats`);
```

### Example 2: Configure Event and Hold Seats

```typescript
// 1. Configure event seating
const config = await seatingService.configureEventSeating({
  eventId: 'event-uuid',
  layoutId: layout.id,
  seatingMode: 'reserved',
  allowsSeatSelection: true,
  pricingStrategy: 'by_section',
  seatHoldDuration: 600,
  accessibleSeatsPercentage: 2.0
});

// 2. Get available seats
const availability = await seatingService.getAvailableSeats('event-uuid', {
  minPrice: 3000,
  maxPrice: 5000
});

// 3. Hold seats for user
const holdResult = await seatingService.holdSeats(
  'event-uuid',
  ['seat-1', 'seat-2', 'seat-3'],
  'user-uuid',
  'session-abc123',
  600 // 10 minutes
);

if (holdResult.success) {
  console.log(`Held ${holdResult.heldSeats.length} seats until ${holdResult.heldUntil}`);

  // 4. Reserve seats after payment
  const reservation = await seatingService.reserveSeats(
    'event-uuid',
    holdResult.heldSeats,
    'user-uuid',
    ['ticket-1', 'ticket-2', 'ticket-3']
  );

  console.log(`Reservation ${reservation.id} confirmed`);
}
```

### Example 3: Handle Accessibility Request

```typescript
// 1. User submits accessibility request
const request = await seatingService.submitAccessibilityRequest({
  eventId: 'event-uuid',
  userId: 'user-uuid',
  requiresWheelchairSpace: true,
  requiresCompanionSeat: true,
  specialRequirements: 'Service dog companion needed'
});

console.log(`Request ${request.id} submitted`);

// 2. Organizer assigns seats
const assigned = await seatingService.assignAccessibleSeats(
  request.id,
  ['accessible-seat-1', 'companion-seat-1'],
  'Assigned wheelchair space #1 with companion seat'
);

if (assigned) {
  console.log('Accessible seats assigned successfully');

  // 3. Approve request
  await seatingService.approveAccessibilityRequest(
    request.id,
    'Confirmed via phone'
  );
}
```

### Example 4: Block Seats for VIP

```typescript
// Block seats for VIP guests
const blocked = await seatingService.blockSeats(
  'event-uuid',
  ['seat-101', 'seat-102', 'seat-103', 'seat-104'],
  'Reserved for keynote speaker and entourage'
);

console.log(`Blocked ${blocked} seats for VIP`);

// Later, unblock if not needed
await seatingService.unblockSeats(
  'event-uuid',
  ['seat-103', 'seat-104']
);
```

---

# DEPLOYMENT GUIDE

## Step 1: Apply Database Migrations

```bash
# Via Supabase CLI
supabase migration up

# Or apply manually in Supabase SQL Editor in order:
1. 20250102_email_marketing.sql
2. 20250102_event_cloning.sql
3. 20250102_seating_management.sql
```

## Step 2: Verify Tables Created

```sql
-- Should return 30 tables total
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'email_templates', 'audience_segments', 'email_campaigns',
  'campaign_variants', 'campaign_sends', 'email_click_tracking',
  'automated_campaigns', 'automated_campaign_queue',
  'email_unsubscribes', 'campaign_reports',
  'event_templates', 'event_series', 'series_events',
  'template_purchases', 'template_reviews', 'event_cloning_history',
  'bulk_event_operations', 'template_collections',
  'template_collection_items',
  'venues', 'venue_layouts', 'seating_sections',
  'seating_rows', 'seats', 'event_seating_configs',
  'seat_reservations', 'section_pricing_tiers', 'seat_groups',
  'accessibility_requests', 'seating_analytics'
);
```

## Step 3: Create Service Layers

Create service files:
- `src/lib/email-marketing/service.ts`
- `src/lib/event-cloning/service.ts`
- `src/lib/seating/service.ts`

Each service should implement the methods outlined in the Service Layer Architecture sections.

## Step 4: Create API Routes

Create route directories:
- `src/app/api/email-marketing/`
- `src/app/api/event-cloning/`
- `src/app/api/seating/`

## Step 5: Test Integration

```typescript
// Test email marketing
const template = await emailMarketingService.createTemplate({...});
const campaign = await emailMarketingService.createCampaign({...});

// Test event cloning
const newEvent = await eventCloningService.cloneEvent(...);

// Test seating
const hold = await seatingService.holdSeats(...);
```

---

# SUMMARY

**Total Systems**: 3
**Total Tables**: 30
**Total Helper Functions**: 10
**Total Value**: $22,000

All database schemas are complete and ready for deployment. Service layers and API routes should be implemented following the specifications in this document.

Each system is:
- ✅ Fully scoped with complete database schema
- ✅ Row Level Security (RLS) enabled
- ✅ Helper functions for common operations
- ✅ Service layer architecture defined
- ✅ API routes specified with examples
- ✅ Usage examples provided

**Next Steps**:
1. Apply database migrations
2. Implement service classes
3. Create API route handlers
4. Build UI components
5. Test integration
6. Deploy to production
