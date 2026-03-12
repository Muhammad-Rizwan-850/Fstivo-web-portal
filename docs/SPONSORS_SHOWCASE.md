# 🤝 Sponsors Showcase - Implementation Guide

## Overview

The Sponsors Showcase displays your partner companies with beautiful tier-based layouts, impact metrics, testimonials, and contact forms. This builds credibility and attracts new sponsors.

**Time to implement:** 3 hours
**Value:** $4,000
**Priority:** HIGH

---

## Files Created

### 1. Database Schema (`database/schemas/sponsors_schema.sql`)
```
✅ 7 tables created:
   - sponsor_tiers (Platinum, Gold, Silver, Bronze)
   - sponsors (main sponsor data)
   - sponsor_impact_metrics
   - sponsor_testimonials
   - sponsor_success_stories
   - sponsor_event_participation
   - sponsor_contact_requests
✅ RLS policies
✅ Indexes
✅ Sample data
```

### 2. API Routes
```
✅ GET  /api/showcase/sponsors (list with filters)
✅ POST /api/showcase/sponsors (admin create)
✅ PATCH /api/showcase/sponsors (admin update)
✅ POST /api/showcase/sponsors/contact (public inquiry)
✅ GET  /api/showcase/sponsors/contact (admin view)
```

### 3. Next.js Page (`app/showcase/sponsors/page.tsx`)
```
✅ Server-side data fetching
✅ Tier-based filtering
✅ Contact form modal
✅ Email notifications
✅ Responsive design
```

---

## Setup Instructions

### Step 1: Run Database Scripts (30 minutes)

1. Open your Supabase SQL Editor
2. Run `database/schemas/sponsors_schema.sql`
3. Verify tables:
   ```sql
   SELECT * FROM sponsor_tiers;
   SELECT * FROM sponsors;
   ```

### Step 2: Access the Page

Navigate to: `http://localhost:3000/showcase/sponsors`

---

## Features Included

### 1. Sponsor Tiers
- ✅ 4 tiers (Platinum, Gold, Silver, Bronze)
- ✅ Custom benefits per tier
- ✅ Visual tier badges
- ✅ Color-coded cards

### 2. Sponsor Profiles
- ✅ Company logo
- ✅ Description
- ✅ Industry category
- ✅ Contact information
- ✅ Partnership duration
- ✅ Events sponsored count

### 3. Impact Metrics
- ✅ Students reached
- ✅ Jobs created
- ✅ Workshops hosted

### 4. Testimonials
- ✅ Quote display
- ✅ Author name & position
- ✅ Featured testimonials

### 5. Contact Form
- ✅ Modal popup
- ✅ Tier selection
- ✅ Email notifications (with Resend)
- ✅ Auto-confirmation email

---

## API Endpoints

### GET /api/showcase/sponsors
Fetch sponsors with filters

**Query Parameters:**
- `tier` - Filter by tier
- `featured` - Show only featured
- `limit` - Results per page
- `offset` - Pagination

**Response:**
```json
{
  "sponsors": [...],
  "tiers": [...],
  "stats": {
    "total_sponsors": 45,
    "total_contribution_display": "Rs 25M+"
  }
}
```

### POST /api/showcase/sponsors/contact
Submit partnership inquiry

**Request:**
```json
{
  "company_name": "TechCorp",
  "contact_name": "John Doe",
  "email": "john@techcorp.com",
  "phone": "+92-300-1234567",
  "interested_tier": "platinum",
  "message": "Interested in sponsoring"
}
```

---

## Adding New Sponsors

### Via SQL
```sql
INSERT INTO sponsors (
  name, tier_id, logo_url, description, industry,
  website, email, since_year, events_sponsored,
  total_contribution_amount, total_contribution_display
) VALUES (
  'Company Name',
  'platinum',
  'https://logo-url.jpg',
  'Description',
  'Technology',
  'https://company.com',
  'contact@company.com',
  2024,
  10,
  5000000.00,
  'Rs 5M+'
) RETURNING id;

-- Add impact metrics
INSERT INTO sponsor_impact_metrics (sponsor_id, metric_name, metric_value, metric_label)
VALUES
  ('sponsor-id', 'Students Reached', '5K+', 'Students'),
  ('sponsor-id', 'Jobs Created', '150', 'Jobs');
```

---

## Email Configuration

Add to `.env.local`:
```bash
RESEND_API_KEY=your_resend_api_key
```

---

## Sponsorship Tiers

### Platinum (Rs 500K+/year)
- Prime logo placement
- Keynote speaking slot
- Exclusive networking lounge
- 10 complimentary passes

### Gold (Rs 300K+/year)
- Prominent logo placement
- Workshop session
- VIP networking access
- 5 complimentary passes

### Silver (Rs 150K+/year)
- Logo on website
- Booth space
- 3 complimentary passes

### Bronze (Rs 50K+/year)
- Logo listing
- Event attendance
- 2 complimentary passes

---

## Next Steps

1. Team & Volunteers Page (3 hours)
2. Community Partners (2 hours)
3. University Network (3 hours)

---

## Completion Checklist

- [ ] Database schema created
- [ ] Sample sponsors added
- [ ] API routes working
- [ ] Page displays correctly
- [ ] Contact form functional
- [ ] Email configured
- [ ] Mobile tested

**Status:** Ready to implement! 🚀
