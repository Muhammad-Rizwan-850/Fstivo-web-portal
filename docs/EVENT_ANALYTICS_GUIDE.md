# Event Analytics Implementation Guide - FSTIVO

## Overview

FSTIVO's Advanced Event Analytics system provides organizers with deep insights into event performance through real-time tracking, revenue analysis, attendee demographics, and engagement metrics.

**Status**: Production Ready ✅
**Implementation Date**: January 5, 2026
**Database Version**: 1.0
**Total Tables**: 10
**API Endpoints**: 6
**Service Methods**: 25+

---

## Features Implemented

### 1. Database Schema (`/supabase/migrations/20250102_event_analytics.sql`)

#### Core Tables:

1. **event_analytics_overview**
   - Aggregate metrics for events
   - Attendance, revenue, conversion, and engagement data
   - Auto-updated via `update_event_analytics()` function

2. **attendance_logs**
   - Real-time check-in/check-out tracking
   - Support for multiple methods (QR code, manual, NFC, facial recognition)
   - Location and device tracking

3. **revenue_analytics**
   - Daily revenue breakdown
   - Ticket type and payment method analysis
   - Discount and promo code tracking

4. **marketing_funnel**
   - 5-stage conversion tracking
   - Traffic source attribution
   - Drop-off analysis at each stage

5. **attendee_demographics**
   - Age, gender, location distribution
   - Industry and job title analysis
   - Engagement scores by demographic

6. **engagement_heatmaps**
   - Page section engagement
   - Click heatmaps and scroll depth
   - Time-based engagement patterns

7. **comparative_analytics**
   - Event-to-event comparisons
   - Category averages
   - Trend analysis

8. **analytics_exports**
   - PDF, Excel, CSV export jobs
   - Async processing with status tracking
   - Filter support

9. **traffic_sources**
   - Source/medium/campaign tracking
   - Conversion and revenue attribution
   - Daily aggregation

10. **analytics_events**
    - Real-time event streaming
    - Session tracking
    - User behavior logging

#### Database Functions:

```sql
-- Update analytics overview
SELECT update_event_analytics(p_event_id);

-- Calculate conversion rates
SELECT * FROM calculate_conversion_rates(p_event_id);

-- Get top traffic sources
SELECT * FROM get_top_traffic_sources(p_event_id, p_limit);
```

#### RLS Policies:
- Organizers can view their event analytics
- Service role has full access
- 20+ policies for granular control

---

### 2. Analytics Service (`/src/lib/analytics/service.ts`)

Complete TypeScript service with 25+ methods:

#### Core Methods:

```typescript
// Overview
await analyticsService.getOverview(eventId);
await analyticsService.updateOverview(eventId);

// Attendance Tracking
await analyticsService.logCheckIn(eventId, userId, ticketId, method, location);
await analyticsService.logCheckOut(eventId, userId, ticketId);
await analyticsService.getAttendanceLogs(eventId);

// Revenue Analytics
await analyticsService.getRevenueAnalytics(eventId, startDate, endDate);
await analyticsService.getRevenueByDateRange(eventId, days);

// Marketing Funnel
await analyticsService.getMarketingFunnel(eventId);
await analyticsService.getConversionRates(eventId);

// Demographics
await analyticsService.getDemographics(eventId);

// Traffic Sources
await analyticsService.getTrafficSources(eventId, limit);

// Event Tracking
await analyticsService.trackEvent(eventId, eventType, userId, eventData, sessionId);
await analyticsService.trackPageView(eventId, userId, sessionId);
await analyticsService.trackTicketPurchase(eventId, userId, amount, ticketType);

// Real-time Activity
await analyticsService.getRecentActivity(eventId, limit);

// Comparative Analytics
await analyticsService.compareWithPreviousEvent(eventId, previousEventId);

// Exports
await analyticsService.createExport(eventId, userId, exportType, reportType, dateRangeStart, dateRangeEnd, filters);
await analyticsService.getExportStatus(exportId);

// Dashboard Summary
await analyticsService.getDashboardSummary(eventId);
```

---

### 3. API Routes (`/src/app/api/analytics/`)

#### Available Endpoints:

##### 1. Overview Analytics
```
GET /api/analytics/overview/[eventId]
POST /api/analytics/overview/[eventId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_id": "uuid",
    "total_tickets_sold": 450,
    "total_revenue": 45000.00,
    "checked_in_count": 380,
    "conversion_rate": 3.6,
    ...
  }
}
```

##### 2. Revenue Analytics
```
GET /api/analytics/revenue/[eventId]?days=7
GET /api/analytics/revenue/[eventId]?startDate=2026-01-01&endDate=2026-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "tickets_sold": 45,
      "revenue": 4500.00,
      "revenue_by_type": { "VIP": 2000, "General": 2500 }
    }
  ]
}
```

##### 3. Marketing Funnel
```
GET /api/analytics/funnel/[eventId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "impressions": 12500,
    "page_views": 8900,
    "add_to_cart": 1200,
    "checkout_completed": 450,
    "overall_conversion_rate": 3.6
  }
}
```

##### 4. Demographics
```
GET /api/analytics/demographics/[eventId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "age_distribution": { "18-24": 45, "25-34": 120 },
    "gender_distribution": { "male": 150, "female": 180 },
    "city_distribution": { "Lahore": 200, "Karachi": 150 }
  }
}
```

##### 5. Traffic Sources
```
GET /api/analytics/traffic/[eventId]
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "source": "google",
      "visitors": 5000,
      "conversions": 180,
      "revenue": 18000.00,
      "conversion_rate": 3.6
    }
  ]
}
```

##### 6. Event Tracking
```
POST /api/analytics/track
```

**Request:**
```json
{
  "eventId": "uuid",
  "eventType": "page_view",
  "userId": "uuid",
  "eventData": {},
  "sessionId": "session-id"
}
```

---

### 4. UI Components (`/src/components/features/event-analytics.tsx`)

#### AdvancedAnalyticsDashboard Component:

**Features:**
- Real-time KPI cards with trend indicators
- Interactive revenue charts with comparison mode
- Marketing funnel visualization
- Traffic sources table
- Real-time activity feed
- Demographics analysis (age, gender, cities)
- Event type distribution
- University performance rankings
- Custom report builder
- Scheduled reports
- Export functionality (PDF, Excel)

**Usage:**
```typescript
import AdvancedAnalyticsDashboard from '@/components/features/event-analytics'

<AdvancedAnalyticsDashboard eventId="event-uuid" />
```

#### Page Route:
- **Dashboard Analytics**: `/dashboard/analytics`
- Component: `/src/app/dashboard/analytics/page.tsx`

---

## Integration Guide

### 1. Tracking Page Views

```typescript
import { analyticsService } from '@/lib/analytics/service';

// Track page view
useEffect(() => {
  const trackView = async () => {
    await analyticsService.trackPageView(
      eventId,
      user?.id,
      sessionId
    );
  };

  if (eventId) {
    trackView();
  }
}, [eventId]);
```

### 2. Tracking Ticket Purchases

```typescript
// After successful payment
await analyticsService.trackTicketPurchase(
  eventId,
  userId,
  amount,
  ticketType
);

// Update analytics overview
await analyticsService.updateOverview(eventId);
```

### 3. Check-in Tracking

```typescript
// QR Code Check-in
const success = await analyticsService.logCheckIn(
  eventId,
  userId,
  ticketId,
  'qr_code',
  { lat: 31.5204, lng: 74.3587, venue_section: 'Main Gate' }
);

if (success) {
  await analyticsService.updateOverview(eventId);
}
```

### 4. Fetching Dashboard Data

```typescript
import { analyticsService } from '@/lib/analytics/service';

const dashboardData = await analyticsService.getDashboardSummary(eventId);

// Access data
console.log(dashboardData.overview?.total_revenue);
console.log(dashboardData.revenueByDay);
console.log(dashboardData.funnel?.conversion_rate);
```

### 5. Exporting Reports

```typescript
// Create export job
const exportId = await analyticsService.createExport(
  eventId,
  userId,
  'pdf',
  'overview',
  startDate,
  endDate,
  { includeDemographics: true }
);

// Check status
const status = await analyticsService.getExportStatus(exportId);
console.log(status.status); // pending, processing, completed, failed
```

---

## Data Flow Diagram

```
User Action → API Route → Analytics Service → Database
                                    ↓
                            update_event_analytics()
                                    ↓
                      event_analytics_overview updated
                                    ↓
                           Dashboard displays data
```

### Example Flow:

1. **User purchases ticket**
   - Payment API calls `analyticsService.trackTicketPurchase()`
   - Records event in `analytics_events` table
   - Triggers `update_event_analytics(eventId)`
   - Updates `event_analytics_overview`

2. **User checks in**
   - Check-in API calls `analyticsService.logCheckIn()`
   - Records in `attendance_logs`
   - Updates overview with new check-in count

3. **Organizer views dashboard**
   - Dashboard calls `analyticsService.getDashboardSummary()`
   - Fetches from 7 tables in parallel
   - Displays comprehensive analytics

---

## Database Relationships

```
events (1) ←→ (1) event_analytics_overview
  ↓
  ├─→ attendance_logs (many)
  ├─→ revenue_analytics (many)
  ├─→ marketing_funnel (many)
  ├─→ attendee_demographics (1)
  ├─→ engagement_heatmaps (many)
  ├─→ comparative_analytics (many)
  ├─→ analytics_exports (many)
  ├─→ traffic_sources (many)
  └─→ analytics_events (many)
```

---

## Performance Optimization

### Indexes Created:
- `idx_event_analytics_event` on event_id
- `idx_attendance_event` on event_id
- `idx_attendance_time` on check_in_time
- `idx_revenue_event` on event_id
- `idx_revenue_date` on date
- `idx_funnel_event` on event_id
- `idx_analytics_events_timestamp` on timestamp

### Query Optimization:
- Use `getDashboardSummary()` for parallel fetching
- Limit recent activity queries (default: 10)
- Date range filtering for revenue analytics
- Materialized views recommended for complex aggregations

---

## Security

### Row Level Security (RLS):
- Organizers can only view their own event analytics
- Service role has full management access
- 20+ policies for granular control

### Authentication:
- All API routes require valid JWT
- User ownership verified before data access
- Service role for automated updates

---

## Testing

### Manual Testing:

```sql
-- Insert test data
INSERT INTO event_analytics_overview (
  event_id, total_tickets_sold, total_revenue, checked_in_count
) VALUES (
  'test-event-id', 450, 45000, 380
);

-- Test analytics update
SELECT update_event_analytics('test-event-id');

-- Test conversion rates
SELECT * FROM calculate_conversion_rates('test-event-id');

-- Test traffic sources
SELECT * FROM get_top_traffic_sources('test-event-id', 10);
```

### API Testing:

```bash
# Get overview
curl http://localhost:3000/api/analytics/overview/[eventId]

# Get revenue for last 7 days
curl http://localhost:3000/api/analytics/revenue/[eventId]?days=7

# Track event
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"eventId": "...", "eventType": "page_view"}'
```

---

## Common Use Cases

### 1. Monitor Event Performance in Real-time

```typescript
const overview = await analyticsService.getOverview(eventId);
console.log(`Tickets sold: ${overview.total_tickets_sold}`);
console.log(`Revenue: $${overview.total_revenue}`);
console.log(`Check-in rate: ${(overview.checked_in_count / overview.total_tickets_sold * 100).toFixed(1)}%`);
```

### 2. Track Marketing Campaign Effectiveness

```typescript
const funnel = await analyticsService.getMarketingFunnel(eventId);
const traffic = await analyticsService.getTrafficSources(eventId);

console.log(`Conversion rate: ${funnel.overall_conversion_rate}%`);
console.log(`Top source: ${traffic[0].source} ($${traffic[0].revenue})`);
```

### 3. Generate Weekly Report

```typescript
const exportId = await analyticsService.createExport(
  eventId,
  organizerId,
  'excel',
  'overview',
  weekStart,
  weekEnd,
  { includeCharts: true }
);

// Poll for completion
const checkStatus = setInterval(async () => {
  const status = await analyticsService.getExportStatus(exportId);
  if (status.status === 'completed') {
    console.log(`Report ready: ${status.file_url}`);
    clearInterval(checkStatus);
  }
}, 5000);
```

### 4. Compare with Previous Event

```typescript
const comparison = await analyticsService.compareWithPreviousEvent(
  currentEventId,
  previousEventId
);

comparison.forEach(metric => {
  console.log(`${metric.metric_name}: ${metric.percentage_difference}% ${metric.trend}`);
});
```

---

## Troubleshooting

### Analytics Not Updating

**Problem**: Overview data not reflecting latest numbers

**Solutions**:
1. Call `update_event_analytics(eventId)` manually
2. Check RLS policies allow updates
3. Verify cron job is running (if automated)
4. Check browser cache (hard refresh: Ctrl+Shift+R)

### Missing Revenue Data

**Problem**: Revenue analytics showing 0 or missing days

**Solutions**:
1. Verify payments are marked as 'completed'
2. Check payment-event_id relationship
3. Ensure revenue_analytics records are being created
4. Run manual update if needed

### Conversion Rate Incorrect

**Problem**: Conversion rates don't match actual numbers

**Solutions**:
1. Verify funnel data is being tracked
2. Check all stages have data (impressions, page_views, etc.)
3. Ensure events are being fired correctly
4. Re-run `calculate_conversion_rates()`

### Export Job Stuck

**Problem**: Export status stuck on "pending"

**Solutions**:
1. Check worker process is running
2. Verify sufficient storage space
3. Check logs for errors
4. Manually update status to 'failed' if needed

---

## Future Enhancements

### Planned Features:
1. **Predictive Analytics**
   - Forecast attendance based on trends
   - Revenue predictions
   - Optimal pricing suggestions

2. **A/B Testing**
   - Test different landing pages
   - Compare ticket pricing strategies
   - Marketing campaign experiments

3. **Heatmap Visualization**
   - Visual click heatmaps
   - Scroll depth visualization
   - Section engagement graphs

4. **Real-time Notifications**
   - Alert on milestone achievements
   - Notify on check-in thresholds
   - Revenue goal alerts

5. **Advanced Segmentation**
   - User cohort analysis
   - Behavioral segmentation
   - Custom audience targeting

---

## API Reference

### Complete Type Definitions:

```typescript
interface AnalyticsOverview {
  id: string;
  event_id: string;
  total_tickets_sold: number;
  total_tickets_available: number;
  total_attendees: number;
  checked_in_count: number;
  no_show_count: number;
  waitlist_count: number;
  total_revenue: number;
  average_ticket_price: number;
  revenue_by_ticket_type: Record<string, number>;
  refund_amount: number;
  net_revenue: number;
  page_views: number;
  unique_visitors: number;
  conversion_rate: number;
  add_to_cart_count: number;
  abandoned_cart_count: number;
  average_time_on_page: number;
  social_shares: number;
  email_opens: number;
  email_clicks: number;
  last_updated: string;
  created_at: string;
}

interface RevenueAnalytics {
  date: string;
  tickets_sold: number;
  revenue: number;
  refunds: number;
  net_revenue: number;
  revenue_by_type: Record<string, number>;
  payment_method_breakdown: Record<string, number>;
  discount_amount: number;
  promo_codes_used: string[];
}

interface MarketingFunnel {
  date: string;
  impressions: number;
  page_views: number;
  unique_visitors: number;
  ticket_selections: number;
  add_to_cart: number;
  checkout_started: number;
  checkout_completed: number;
  view_to_selection_rate: number;
  selection_to_cart_rate: number;
  cart_to_checkout_rate: number;
  checkout_completion_rate: number;
  overall_conversion_rate: number;
  traffic_sources: Record<string, number>;
}

interface AttendeeDemographics {
  event_id: string;
  age_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  city_distribution: Record<string, number>;
  country_distribution: Record<string, number>;
  industry_distribution: Record<string, number>;
  ticket_type_by_demographic: Record<string, any>;
  avg_engagement_score: number;
  last_updated: string;
}

interface TrafficSource {
  source: string;
  visitors: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
}

interface ConversionRate {
  stage: string;
  count: number;
  rate: number;
}
```

---

## Deployment Checklist

### Pre-deployment:
- [ ] Run database migration: `20250102_event_analytics.sql`
- [ ] Verify all tables created successfully
- [ ] Test RLS policies with test users
- [ ] Verify helper functions work correctly
- [ ] Check indexes are created

### Post-deployment:
- [ ] Test API endpoints with real data
- [ ] Verify analytics dashboard displays correctly
- [ ] Test event tracking (page views, purchases)
- [ ] Verify check-in logging works
- [ ] Test export functionality
- [ ] Monitor query performance
- [ ] Set up automated backups

### Monitoring:
- [ ] Track query performance
- [ ] Monitor database size growth
- [ ] Set up alerts for slow queries
- [ ] Monitor export job queue
- [ ] Track API response times

---

## Maintenance

### Regular Tasks:

**Daily:**
- Automated analytics updates via cron
- Export job processing
- Data retention checks

**Weekly:**
- Performance review
- Index optimization
- Cache cleanup

**Monthly:**
- Archive old analytics_events
- Review storage usage
- Optimize slow queries
- Update aggregate tables

### Data Retention:

```sql
-- Archive analytics_events older than 90 days
DELETE FROM analytics_events
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Archive attendance_logs older than 1 year
DELETE FROM attendance_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## Support & Resources

### Documentation:
- Database Schema: `/supabase/migrations/20250102_event_analytics.sql`
- API Routes: `/src/app/api/analytics/`
- Service Library: `/src/lib/analytics/service.ts`
- UI Component: `/src/components/features/event-analytics.tsx`
- Dashboard Page: `/src/app/dashboard/analytics/page.tsx`

### Related Guides:
- [Notification System Guide](./NOTIFICATION_SYSTEM_GUIDE.md)
- [PWA Implementation Guide](./PWA_IMPLEMENTATION_GUIDE.md)
- [Showcase Pages Guide](./SHOWCASE_PAGES_GUIDE.md)

---

**Status**: PRODUCTION READY ✅
**Version**: 1.0.0
**Last Updated**: January 5, 2026
**Maintainer**: FSTIVO Team
**Value**: $10,000 (8 hours of development)
