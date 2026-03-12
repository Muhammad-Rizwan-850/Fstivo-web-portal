# 🚀 FSTIVO Organizer Tools - Quick Reference

**Last Updated**: January 5, 2026

---

## 📁 File Structure

```
supabase/migrations/
└── 20250105_organizer_tools.sql          # Complete database schema (38 tables)

src/lib/database/queries/
├── analytics.ts                          # Analytics query functions
├── email-marketing.ts                    # Email marketing query functions
├── templates.ts                          # Template query functions
└── seating.ts                            # Seating query functions

src/lib/actions/
├── analytics-actions.ts                  # Analytics server actions
├── email-campaign-actions.ts             # Email campaign server actions
├── event-template-actions.ts             # Template server actions
└── seating-actions.ts                    # Seating server actions

docs/
├── ORGANIZER_TOOLS_IMPLEMENTATION.md     # Full implementation guide
└── ORGANIZER_TOOLS_QUICK_REFERENCE.md    # This file
```

---

## 🎯 Quick Start

### 1. Apply Database Migration

```bash
supabase db push
```

### 2. Import Server Actions

```typescript
// Analytics
import { getEventAnalyticsAction } from '@/lib/actions/analytics-actions'

// Email Marketing
import { createEmailCampaignAction } from '@/lib/actions/email-campaign-actions'

// Templates
import { cloneEventAction } from '@/lib/actions/event-template-actions'

// Seating
import { createSeatingLayoutAction } from '@/lib/actions/seating-actions'
```

### 3. Use in Components

```typescript
'use client'

export default function MyComponent() {
  const handleAction = async () => {
    const { success, data, error } = await someAction(params)
    if (success) {
      // Handle success
    } else {
      // Handle error
    }
  }

  return <button onClick={handleAction}>Go</button>
}
```

---

## 📊 Analytics Functions

### Server Actions

```typescript
// Get comprehensive analytics
await getEventAnalyticsAction(eventId)

// Get attendance stats
await getAttendanceStatsAction(eventId)

// Record attendance
await recordAttendanceAction({
  eventId,
  checkedInCount,
  totalRegistered
})

// Get revenue summary
await getRevenueSummaryAction(eventId)

// Get engagement heatmap
await getEngagementHeatmapAction({
  eventId,
  startDate,
  endDate
})

// Track funnel metrics
await trackMarketingFunnelAction({
  eventId,
  funnelDate,
  pageViews,
  uniqueVisitors,
  registrationClicks,
  registrationsCompleted
})

// Generate analytics report
await generateAnalyticsReportAction({
  eventId,
  reportType,
  reportName,
  dateRangeStart,
  dateRangeEnd,
  filters
})
```

### Direct Query Functions

```typescript
import {
  getAttendanceTracking,
  getRevenueAnalytics,
  getMarketingFunnel,
  getTrafficSources,
  getEventPerformance
} from '@/lib/database/queries/analytics'
```

---

## 📧 Email Marketing Functions

### Server Actions

```typescript
// Create template
await createEmailTemplateAction({
  templateName,
  templateType,
  subjectLine,
  htmlContent,
  isPublic
})

// Create campaign
await createEmailCampaignAction({
  eventId,
  name,
  subjectLine,
  htmlContent,
  segmentId,
  scheduledAt
})

// Send campaign
await sendCampaignAction(campaignId)

// Create A/B test
await createABTestAction({
  campaignId,
  variantName,
  variantType,
  subjectLine
})

// Setup automation
await createEmailAutomationAction({
  automationName,
  triggerType, // 'registration' | 'payment' | 'check_in' | 'event_end'
  triggerConditions,
  steps
})

// Create audience segment
await createAudienceSegmentAction({
  segmentName,
  segmentType,
  filters
})
```

### Direct Query Functions

```typescript
import {
  getEmailTemplates,
  getEmailCampaigns,
  getCampaignPerformance,
  createABTest,
  triggerAutomation
} from '@/lib/database/queries/email-marketing'
```

---

## 📋 Template Functions

### Server Actions

```typescript
// Save event as template
await saveAsTemplateAction({
  eventId,
  templateName,
  description,
  isPublic,
  tags
})

// Clone event
await cloneEventAction({
  eventId,
  newDate,
  cloneType // 'full' | 'structure_only' | 'with_registrations'
})

// Create from template
await createFromTemplateAction({
  templateId,
  eventData: {
    title,
    startDate,
    endDate,
    location
  }
})

// Create event series
await createEventSeriesAction({
  seriesName,
  recurrencePattern: {
    frequency, // 'daily' | 'weekly' | 'monthly'
    interval,
    endDate,
    daysOfWeek
  },
  parentEventId,
  generateEvents
})

// Browse marketplace
await getMarketplaceTemplatesAction({
  category,
  eventType,
  search,
  sortBy, // 'popular' | 'rating' | 'recent'
  limit
})

// Review template
await createTemplateReviewAction({
  templateId,
  rating, // 1-5
  reviewText
})
```

### Direct Query Functions

```typescript
import {
  getEventTemplates,
  searchTemplates,
  getTemplateReviews,
  getCloneHistory,
  recordEventClone
} from '@/lib/database/queries/templates'
```

---

## 💺 Seating Functions

### Server Actions

```typescript
// Create venue
await createVenueAction({
  venueName,
  capacity,
  address,
  city,
  accessibilityFeatures
})

// Create seating layout
await createSeatingLayoutAction({
  eventId,
  layoutName,
  layoutType, // 'theater' | 'stadium' | 'classroom' | 'banquet' | 'cocktail' | 'custom'
  totalCapacity,
  stagePosition
})

// Duplicate layout
await duplicateSeatingLayoutAction(layoutId, newEventId)

// Create section
await createSeatingSectionAction({
  layoutId,
  sectionName,
  sectionType, // 'general' | 'vip' | 'premium' | 'accessible' | 'reserved'
  basePrice,
  capacity,
  color
})

// Generate seats
await generateSeatsAction({
  sectionId,
  rowCount,
  seatsPerRow,
  rowLabels,
  startNumber
})

// Reserve seat
await reserveSeatAction({
  seatId,
  registrationId,
  reservationType, // 'temporary' | 'confirmed' | 'held'
  expiresAt
})

// Confirm reservation
await confirmSeatReservationAction(reservationId)

// Cancel reservation
await cancelSeatReservationAction(reservationId)

// Request accessible seating
await requestAccessibleSeatingAction({
  registrationId,
  requestType,
  details
})

// Create group booking
await createGroupSeatingAction({
  groupName,
  groupSize,
  contactEmail,
  eventId
})

// Assign seats to group
await assignSeatsToGroupAction(groupId, seatIds)

// Get best available seats
await getBestAvailableSeatsAction({
  sectionId,
  quantity,
  together
})
```

### Direct Query Functions

```typescript
import {
  getVenues,
  getSeatingLayouts,
  getSeats,
  getAvailableSeats,
  getSeatReservations,
  getSeatingAvailability
} from '@/lib/database/queries/seating'
```

---

## 🔐 Authentication Pattern

All server actions follow this security pattern:

```typescript
'use server'

export async function someAction(params: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Check authentication
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Verify ownership
  const { data: resource } = await supabase
    .from('table_name')
    .select('created_by, organizer_id')
    .eq('id', params.id)
    .single()

  if (!resource || (resource.created_by !== user.id && resource.organizer_id !== user.id)) {
    return { success: false, error: 'Unauthorized' }
  }

  // 3. Perform action
  try {
    const result = await doSomething(params)
    revalidatePath('/dashboard/...')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
```

---

## 📊 Database Views

### v_event_performance
```typescript
const { data } = await supabase
  .from('v_event_performance')
  .select('*')
  .eq('event_id', eventId)

// Returns: total_registrations, paid_registrations, total_revenue, etc.
```

### v_funnel_conversion
```typescript
const { data } = await supabase
  .from('v_funnel_conversion')
  .select('*')
  .eq('event_id', eventId)

// Returns: funnel data with conversion rates
```

### v_campaign_performance
```typescript
const { data } = await supabase
  .from('v_campaign_performance')
  .select('*')
  .eq('event_id', eventId)

// Returns: email campaign metrics
```

### v_seating_availability
```typescript
const { data } = await supabase
  .from('v_seating_availability')
  .select('*')
  .eq('layout_id', layoutId)

// Returns: seating availability by section
```

---

## 🔄 Database Functions

```typescript
// Calculate traffic source ROI
const { data } = await supabase.rpc('calculate_traffic_source_roi', {
  p_source_id: sourceId
})

// Release expired seat holds
const released = await supabase.rpc('release_expired_seat_holds')

// Trigger automated follow-up emails
await supabase.rpc('trigger_automated_followup', {
  p_event_id: eventId,
  p_trigger_type: 'registration'
})
```

---

## 📝 Common Patterns

### Pattern 1: Load and Display Data

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getEventAnalyticsAction } from '@/lib/actions/analytics-actions'

export function AnalyticsDashboard({ eventId }: { eventId: string }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { success, data } = await getEventAnalyticsAction(eventId)
      if (success) {
        setData(data)
      }
      setLoading(false)
    }
    loadData()
  }, [eventId])

  if (loading) return <div>Loading...</div>
  return <div>{/* Display data */}</div>
}
```

### Pattern 2: Form Submission

```typescript
'use client'

import { useState } from 'react'
import { createEmailCampaignAction } from '@/lib/actions/email-campaign-actions'

export function CampaignForm({ eventId }: { eventId: string }) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormData) => {
    setSubmitting(true)
    const { success, error } = await createEmailCampaignAction({
      eventId,
      name: e.get('name'),
      subjectLine: e.get('subject'),
      htmlContent: e.get('content')
    })
    setSubmitting(false)

    if (success) {
      alert('Campaign created!')
    } else {
      alert(`Error: ${error}`)
    }
  }

  return (
    <form action={handleSubmit}>
      <input name="name" />
      <button disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
```

### Pattern 3: Real-time Updates

```typescript
'use client'

import { useOptimistic } from 'react'
import { reserveSeatAction } from '@/lib/actions/seating-actions'

export function SeatPicker({ seats }: { seats: Seat[] }) {
  const [reservedSeats, setReservedSeats] = useState<string[]>([])

  const handleReserve = async (seatId: string) => {
    const { success } = await reserveSeatAction({
      seatId,
      registrationId,
      reservationType: 'temporary'
    })

    if (success) {
      setReservedSeats([...reservedSeats, seatId])
    }
  }

  return (
    <div>
      {seats.map(seat => (
        <div
          key={seat.id}
          className={reservedSeats.includes(seat.id) ? 'reserved' : 'available'}
          onClick={() => handleReserve(seat.id)}
        >
          {seat.seat_number}
        </div>
      ))}
    </div>
  )
}
```

---

## 🎨 Color Reference

### Status Colors
```css
/* Email Campaigns */
.status-draft { color: #6b7280; }
.status-scheduled { color: #3b82f6; }
.status-sending { color: #f59e0b; }
.status-sent { color: #10b981; }
.status-failed { color: #ef4444; }

/* Seat Status */
.seat-available { background: #10b981; }
.seat-reserved { background: #f59e0b; }
.seat-held { background: #8b5cf6; }
.seat-sold { background: #ef4444; }
.seat-blocked { background: #6b7280; }
.seat-accessible { border: 2px solid #3b82f6; }

/* Section Types */
.section-vip { background: #fbbf24; }
.section-premium { background: #60a5fa; }
.section-general { background: #34d399; }
.section-accessible { background: #a78bfa; }
```

---

## ⚡ Performance Tips

1. **Use specific columns**: `select('id, name')` instead of `select('*')`
2. **Paginate large lists**: Add `.range(0, 49)` for 50 items
3. **Cache expensive queries**: Use SWR or React Query
4. **Debounce search inputs**: Wait 300ms before searching
5. **Use views for aggregates**: `v_event_performance` is pre-calculated

---

## 🐛 Debugging

### Check Database Connection
```typescript
const supabase = await createClient()
const { data, error } = await supabase
  .from('attendance_tracking')
  .select('*')
  .limit(1)

console.log('DB Test:', data || error)
```

### Check Auth
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user?.id)
```

### Enable Query Logging
```typescript
// In supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: { schema: 'public' },
    global: {
      headers: { 'x-debug': 'true' }
    }
  }
)
```

---

## 📚 Additional Resources

- **Full Implementation Guide**: `docs/ORGANIZER_TOOLS_IMPLEMENTATION.md`
- **Security Fixes**: `docs/SECURITY_FIXES_IMPLEMENTATION.md`
- **Type Definitions**: Check each query file for TypeScript interfaces
- **RLS Policies**: Defined in migration file
- **Database Functions**: Defined in migration file

---

## ✅ Implementation Checklist

### Database
- [x] 38 tables created
- [x] 4 views created
- [x] 3 functions created
- [x] RLS policies applied
- [x] Indexes created

### Backend
- [x] Analytics query functions
- [x] Email marketing query functions
- [x] Template query functions
- [x] Seating query functions
- [x] Analytics server actions
- [x] Email campaign server actions
- [x] Template server actions
- [x] Seating server actions

### Documentation
- [x] Implementation guide
- [x] Quick reference guide

### Optional (Frontend)
- [ ] Analytics dashboard component
- [ ] Email campaign builder component
- [ ] Template marketplace component
- [ ] Seating layout builder component

---

**Status**: ✅ Backend Complete - Ready for Frontend Development
**Production Readiness**: 90%
