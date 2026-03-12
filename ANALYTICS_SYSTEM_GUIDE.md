# FSTIVO Event Analytics System - Complete Implementation Guide

## Overview

The FSTIVO Event Analytics System is a comprehensive analytics and reporting platform built for Next.js 15 with Supabase. It provides real-time insights into event performance, revenue tracking, marketing funnel analysis, attendee demographics, and traffic source attribution.

## Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [API Routes](#api-routes)
5. [Dashboard UI](#dashboard-ui)
6. [Implementation Steps](#implementation-steps)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)

---

## Features

### Core Analytics Capabilities

- **Real-time Event Tracking**: Track user interactions, page views, and conversions
- **Revenue Analytics**: Daily revenue tracking with breakdowns by ticket type, payment method, and discounts
- **Attendance Management**: Check-in/check-out logging with location and device tracking
- **Marketing Funnel**: Complete funnel from impressions to purchase completion
- **Demographics Analysis**: Age, gender, location, and professional background insights
- **Traffic Source Attribution**: Track which channels drive the most visitors and conversions
- **Engagement Heatmaps**: Peak attendance times and popular event sections
- **Comparative Analytics**: Compare event performance against benchmarks
- **Export Functionality**: Generate PDF and Excel reports
- **Conversion Rate Tracking**: Monitor and optimize conversion funnels

---

## Database Schema

### Migration File

**File**: `supabase/migrations/20250102_event_analytics.sql`

### Tables

#### 1. `event_analytics_overview`
Stores high-level metrics for each event.

```sql
CREATE TABLE event_analytics_overview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    total_tickets_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_check_ins INTEGER DEFAULT 0,
    total_no_shows INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2),
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);
```

#### 2. `attendance_logs`
Detailed attendance tracking with check-in/check-out events.

```sql
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'checked_in', 'checked_out', 'no_show'
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    location_method VARCHAR(50), -- 'qr_code', 'nfc', 'manual', 'gps'
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `revenue_analytics`
Daily revenue tracking with detailed breakdowns.

```sql
CREATE TABLE revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tickets_sold INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    revenue_by_ticket_type JSONB DEFAULT '{}',
    revenue_by_payment_method JSONB DEFAULT '{}',
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    refund_amount DECIMAL(12, 2) DEFAULT 0,
    average_order_value DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, date)
);
```

#### 4. `marketing_funnel`
Marketing funnel tracking from impressions to conversion.

```sql
CREATE TABLE marketing_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    ticket_selections INTEGER DEFAULT 0,
    checkout_started INTEGER DEFAULT 0,
    checkout_completed INTEGER DEFAULT 0,
    conversion_rates JSONB DEFAULT '{}',
    traffic_sources JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, date)
);
```

#### 5. `attendee_demographics`
Aggregated demographic information about attendees.

```sql
CREATE TABLE attendee_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
    age_distribution JSONB DEFAULT '{}',
    gender_distribution JSONB DEFAULT '{}',
    city_distribution JSONB DEFAULT '{}',
    country_distribution JSONB DEFAULT '{}',
    professional_background JSONB DEFAULT '{}',
    interests_tags JSONB DEFAULT '{}',
    first_time_attendees INTEGER DEFAULT 0,
    returning_attendees INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. `engagement_heatmaps`
Peak attendance times and popular sections.

```sql
CREATE TABLE engagement_heatmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour_of_day INTEGER NOT NULL,
    attendance_count INTEGER DEFAULT 0,
    check_ins INTEGER DEFAULT 0,
    popular_sections JSONB DEFAULT '{}',
    average_stay_duration INTEGER, -- in minutes
    UNIQUE(event_id, date, hour_of_day)
);
```

#### 7. `comparative_analytics`
Event performance compared to benchmarks.

```sql
CREATE TABLE comparative_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    similar_events_avg_revenue DECIMAL(12, 2),
    similar_events_avg_attendance INTEGER,
    industry_benchmark_revenue DECIMAL(12, 2),
    industry_benchmark_attendance INTEGER,
    performance_rating VARCHAR(20), -- 'above_average', 'average', 'below_average'
    strengths TEXT[],
    improvement_areas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);
```

#### 8. `analytics_exports`
Track generated analytics reports.

```sql
CREATE TABLE analytics_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL, -- 'revenue', 'attendance', 'demographics', 'complete'
    format VARCHAR(20) NOT NULL, -- 'pdf', 'excel', 'csv'
    date_range_start DATE,
    date_range_end DATE,
    file_url TEXT,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. `traffic_sources`
Detailed traffic source analytics.

```sql
CREATE TABLE traffic_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'google', 'facebook', 'instagram', 'direct', etc.
    medium VARCHAR(100), -- 'organic', 'paid', 'social', 'email', etc.
    campaign VARCHAR(255),
    visitors INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    cost DECIMAL(12, 2) DEFAULT 0,
    UNIQUE(event_id, date, source, medium, campaign)
);
```

#### 10. `analytics_events`
Real-time event tracking log.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'click', 'purchase', etc.
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Helper Functions

```sql
-- Update analytics overview
CREATE OR REPLACE FUNCTION update_event_analytics(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO event_analytics_overview (event_id, total_tickets_sold, total_revenue, total_check_ins)
  VALUES (
    p_event_id,
    (SELECT COALESCE(COUNT(*), 0) FROM tickets WHERE event_id = p_event_id AND status = 'purchased'),
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event_id = p_event_id AND status = 'completed'),
    (SELECT COALESCE(COUNT(*), 0) FROM attendance_logs WHERE event_id = p_event_id AND action_type = 'checked_in')
  )
  ON CONFLICT (event_id) DO UPDATE SET
    total_tickets_sold = EXCLUDED.total_tickets_sold,
    total_revenue = EXCLUDED.total_revenue,
    total_check_ins = EXCLUDED.total_check_ins,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Calculate conversion rates
CREATE OR REPLACE FUNCTION calculate_conversion_rates(p_event_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
  funnel_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'impression_to_view', CASE WHEN impressions > 0 THEN ROUND((page_views::decimal / impressions * 100), 2) ELSE 0 END,
    'view_to_selection', CASE WHEN page_views > 0 THEN ROUND((ticket_selections::decimal / page_views * 100), 2) ELSE 0 END,
    'selection_to_checkout', CASE WHEN ticket_selections > 0 THEN ROUND((checkout_started::decimal / ticket_selections * 100), 2) ELSE 0 END,
    'checkout_to_purchase', CASE WHEN checkout_started > 0 THEN ROUND((checkout_completed::decimal / checkout_started * 100), 2) ELSE 0 END,
    'overall_conversion', CASE WHEN impressions > 0 THEN ROUND((checkout_completed::decimal / impressions * 100), 2) ELSE 0 END
  ) INTO funnel_data
  FROM marketing_funnel
  WHERE event_id = p_event_id AND date = p_date;

  RETURN funnel_data;
END;
$$ LANGUAGE plpgsql;

-- Get top traffic sources
CREATE OR REPLACE FUNCTION get_top_traffic_sources(p_event_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(source VARCHAR, visitors INT, revenue DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    source,
    SUM(visitors) as visitors,
    SUM(revenue) as revenue
  FROM traffic_sources
  WHERE event_id = p_event_id
  GROUP BY source
  ORDER BY visitors DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## Service Layer

### AnalyticsService

**File**: `src/lib/analytics/service.ts`

The `AnalyticsService` class provides all analytics operations:

#### Methods

##### Overview Methods
```typescript
async getOverview(eventId: string): Promise<AnalyticsOverview | null>
```
Fetches high-level analytics for an event.

```typescript
async updateOverview(eventId: string): Promise<boolean>
```
Recalculates and updates analytics overview.

##### Attendance Tracking
```typescript
async logCheckIn(
  eventId: string,
  userId: string,
  ticketId: string,
  method: string,
  location?: string
): Promise<boolean>
```
Records a user check-in with method and optional location.

```typescript
async logCheckOut(
  eventId: string,
  userId: string,
  ticketId: string
): Promise<boolean>
```
Records a user check-out.

```typescript
async getAttendanceLogs(eventId: string)
```
Retrieves all attendance logs for an event.

##### Revenue Analytics
```typescript
async getRevenueAnalytics(
  eventId: string,
  startDate: Date,
  endDate: Date
)
```
Gets revenue analytics for a custom date range.

```typescript
async getRevenueByDateRange(
  eventId: string,
  days: number = 7
)
```
Gets revenue analytics for the last N days.

##### Marketing Funnel
```typescript
async getMarketingFunnel(eventId: string)
```
Retrieves complete marketing funnel data.

```typescript
async getConversionRates(eventId: string)
```
Calculates and returns conversion rates at each funnel stage.

##### Demographics
```typescript
async getDemographics(eventId: string)
```
Fetches attendee demographic data.

##### Traffic Sources
```typescript
async getTrafficSources(
  eventId: string,
  limit: number = 10
)
```
Gets top traffic sources by visitor count.

##### Event Tracking
```typescript
async trackEvent(
  eventId: string,
  eventType: string,
  userId?: string,
  eventData?: Record<string, any>,
  sessionId?: string
): Promise<boolean>
```
Tracks custom analytics events.

```typescript
async trackPageView(
  eventId: string,
  userId?: string,
  sessionId?: string
): Promise<boolean>
```
Tracks page views.

```typescript
async trackTicketPurchase(
  eventId: string,
  userId: string,
  amount: number,
  ticketType: string
): Promise<boolean>
```
Tracks ticket purchase events.

##### Dashboard Summary
```typescript
async getDashboardSummary(eventId: string)
```
Aggregates all analytics data for dashboard display.

---

## API Routes

### 1. GET/POST `/api/analytics/overview`

**GET**: Fetch analytics overview for an event.

**Query Parameters**:
- `eventId` (string, required): Event ID

**Response**:
```json
{
  "success": true,
  "data": {
    "total_tickets_sold": 1234,
    "total_revenue": 24580.00,
    "total_check_ins": 968,
    "conversion_rate": 4.2
  }
}
```

**POST**: Update analytics overview.

### 2. GET `/api/analytics/revenue`

**Query Parameters**:
- `eventId` (string, required): Event ID
- `days` (number, optional): Number of days (default: 7)
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "tickets_sold": 150,
      "revenue": 3200.00,
      "average_order_value": 21.33
    }
  ]
}
```

### 3. GET `/api/analytics/funnel`

**Query Parameters**:
- `eventId` (string, required): Event ID

**Response**:
```json
{
  "success": true,
  "data": {
    "funnel": {
      "impressions": 15420,
      "page_views": 8730,
      "checkout_completed": 1234
    },
    "conversionRates": {
      "impression_to_view": 57.0,
      "overall_conversion": 8.0
    }
  }
}
```

### 4. GET `/api/analytics/demographics`

**Query Parameters**:
- `eventId` (string, required): Event ID

**Response**:
```json
{
  "success": true,
  "data": {
    "age_distribution": {
      "18-24": 28,
      "25-34": 42
    },
    "gender_distribution": {
      "male": 45,
      "female": 48
    },
    "city_distribution": {
      "New York": 423,
      "Los Angeles": 312
    }
  }
}
```

### 5. GET `/api/analytics/traffic`

**Query Parameters**:
- `eventId` (string, required): Event ID
- `limit` (number, optional): Number of sources (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "source": "google",
      "visitors": 4520,
      "percentage": 35.2
    }
  ]
}
```

### 6. POST `/api/analytics/track`

**Body Parameters**:
```json
{
  "eventId": "uuid",
  "eventType": "page_view",
  "userId": "uuid",
  "eventData": {
    "page": "/events/123",
    "referrer": "google"
  },
  "sessionId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```

---

## Dashboard UI

### Analytics Dashboard Component

**File**: `src/app/analytics/dashboard/page.tsx`

A comprehensive React dashboard with:

#### Features
- **KPI Cards**: Total revenue, tickets sold, check-in rate, conversion rate with trend indicators
- **Revenue Trend Chart**: 7-day bar chart showing revenue progression
- **Marketing Funnel Visualization**: Progress bars showing conversion at each stage
- **Traffic Sources Table**: Top referrers with visitor counts and percentages
- **Real-time Activity Feed**: Live updates of user actions
- **Demographics Charts**:
  - Age distribution (bar chart)
  - Gender distribution (bar chart)
  - Top cities (list)

#### Usage

The dashboard uses mock data for demonstration. To connect to real data:

```typescript
// Fetch real data from API
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch(`/api/analytics/overview?eventId=${eventId}`);
    const data = await response.json();
    setStats(data.data);
  };
  fetchData();
}, [eventId]);
```

---

## Implementation Steps

### 1. Run Database Migration

```bash
# Apply the migration to your Supabase database
supabase migration up
```

Or apply manually via Supabase dashboard:
1. Open Supabase SQL Editor
2. Copy contents of `supabase/migrations/20250102_event_analytics.sql`
3. Execute the SQL

### 2. Verify Tables

```bash
# Via Supabase CLI
supabase db remote tables list

# Or check via SQL
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'analytics%';
```

### 3. Test Analytics Service

Create a test script:

```typescript
// test-analytics.ts
import { analyticsService } from '@/lib/analytics/service';

async function testAnalytics() {
  const eventId = 'your-event-id';

  // Test overview
  const overview = await analyticsService.getOverview(eventId);
  console.log('Overview:', overview);

  // Test revenue analytics
  const revenue = await analyticsService.getRevenueByDateRange(eventId, 7);
  console.log('Revenue:', revenue);

  // Test funnel
  const funnel = await analyticsService.getMarketingFunnel(eventId);
  console.log('Funnel:', funnel);
}

testAnalytics();
```

### 4. Test API Routes

```bash
# Test overview endpoint
curl http://localhost:3000/api/analytics/overview?eventId=YOUR_EVENT_ID

# Test revenue endpoint
curl http://localhost:3000/api/analytics/revenue?eventId=YOUR_EVENT_ID&days=7

# Test funnel endpoint
curl http://localhost:3000/api/analytics/funnel?eventId=YOUR_EVENT_ID

# Test demographics endpoint
curl http://localhost:3000/api/analytics/demographics?eventId=YOUR_EVENT_ID

# Test traffic endpoint
curl http://localhost:3000/api/analytics/traffic?eventId=YOUR_EVENT_ID&limit=5

# Test tracking endpoint
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "eventType": "page_view",
    "userId": "USER_ID",
    "sessionId": "SESSION_ID"
  }'
```

### 5. Access Dashboard

Navigate to: `http://localhost:3000/analytics/dashboard`

---

## Usage Examples

### Tracking Page Views

```typescript
// On event page load
await analyticsService.trackPageView(eventId, userId, sessionId);
```

### Recording Check-ins

```typescript
// When attendee checks in
await analyticsService.logCheckIn(
  eventId,
  userId,
  ticketId,
  'qr_code',
  'Main Entrance'
);
```

### Getting Revenue Report

```typescript
// Last 30 days revenue
const revenue = await analyticsService.getRevenueByDateRange(eventId, 30);

// Custom date range
const revenue = await analyticsService.getRevenueAnalytics(
  eventId,
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

### Fetching Dashboard Data

```typescript
// Get all dashboard data at once
const summary = await analyticsService.getDashboardSummary(eventId);

console.log(summary.overview.total_revenue);
console.log(summary.funnel.conversion_rates);
console.log(summary.demographics.age_distribution);
```

---

## Testing

### Unit Tests (Recommended)

```typescript
// __tests__/analytics.test.ts
import { analyticsService } from '@/lib/analytics/service';

describe('AnalyticsService', () => {
  test('should track page view', async () => {
    const result = await analyticsService.trackPageView(
      'test-event-id',
      'test-user-id',
      'test-session-id'
    );
    expect(result).toBe(true);
  });

  test('should get revenue analytics', async () => {
    const revenue = await analyticsService.getRevenueByDateRange('event-id', 7);
    expect(revenue).toHaveLength(7);
  });
});
```

### Integration Tests

Test API endpoints with actual database:

```bash
# Test event tracking
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-id",
    "eventType": "test_event",
    "userId": "test-user-id"
  }'

# Verify in database
supabase db remote execute "SELECT * FROM analytics_events WHERE event_type = 'test_event' LIMIT 1;"
```

---

## Performance Considerations

### Indexes

All tables include appropriate indexes for common queries:

- `event_id` indexes on all tables
- Composite indexes for date-range queries
- `user_id` indexes for user-specific analytics

### Optimization Tips

1. **Batch Analytics Updates**: Don't update analytics on every transaction. Use batch jobs or triggers.
2. **Cache Overview Data**: Cache overview data for 5-15 minutes to reduce database load.
3. **Partition Large Tables**: Consider partitioning `analytics_events` by date for high-volume events.
4. **Materialized Views**: For complex aggregations, consider materialized views with refresh strategies.

---

## Security

### Row Level Security (RLS)

All tables implement RLS policies:

```sql
-- Event organizers can view their event analytics
CREATE POLICY "Organizers can view analytics"
ON analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = analytics_events.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Service role can insert analytics
CREATE POLICY "Service role can insert analytics"
ON analytics_events FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

### API Authentication

All API routes (except `/track`) require authentication:

```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Troubleshooting

### Issue: Analytics overview not updating

**Solution**: Manually trigger update:
```sql
SELECT update_event_analytics('your-event-id');
```

### Issue: Conversion rates showing null

**Solution**: Ensure funnel data exists:
```sql
SELECT * FROM marketing_funnel WHERE event_id = 'your-event-id';
```

### Issue: Traffic sources empty

**Solution**: Check UTM parameters are being tracked:
```typescript
await analyticsService.trackEvent(eventId, 'page_view', userId, {
  utm_source: 'google',
  utm_medium: 'organic',
  utm_campaign: 'spring_sale'
});
```

---

## Future Enhancements

- Real-time WebSocket updates for dashboard
- Machine learning predictions for attendance
- A/B testing integration
- Custom report builder
- API for third-party analytics tools (Google Analytics, Mixpanel)
- Automated anomaly detection
- cohort analysis

---

## Support

For issues or questions:
1. Check Supabase logs: `supabase functions logs`
2. Verify database migration: `supabase migration list`
3. Test API routes individually
4. Check browser console for frontend errors

---

## License

This analytics system is part of FSTIVO platform.
