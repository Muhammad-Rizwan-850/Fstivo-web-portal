# Past Events Gallery - Implementation Guide

## Overview

The Past Events Gallery showcases completed events with photos, statistics, testimonials, and impact metrics. This builds trust and credibility for your platform.

## Files Created

### 1. Database Schema
- `database/schemas/past_events_schema.sql` - Tables and RLS policies
- `database/schemas/past_events_functions.sql` - SQL functions and sample data

### 2. API Route
- `src/app/api/showcase/past-events/route.ts` - GET/POST endpoints

### 3. Components
- `src/app/showcase/past-events/page.tsx` - Full page component
- `src/components/showcase/past-events-gallery.tsx` - Reusable component

## Setup Instructions

### Step 1: Run Database Scripts

1. Open your Supabase SQL Editor
2. Run `database/schemas/past_events_schema.sql`
3. Run `database/schemas/past_events_functions.sql`

```bash
# Or run via psql if you have direct DB access
psql -h your-db.supabase.co -U postgres -d postgres -f database/schemas/past_events_schema.sql
psql -h your-db.supabase.co -U postgres -d postgres -f database/schemas/past_events_functions.sql
```

### Step 2: Verify Installation

Check that tables were created:

```sql
SELECT COUNT(*) FROM past_events_showcase;
SELECT COUNT(*) FROM event_gallery;
SELECT COUNT(*) FROM event_testimonials;

-- Test the stats function
SELECT get_past_events_stats();
```

### Step 3: Access the Page

Navigate to: `http://localhost:3000/showcase/past-events`

## Usage

### As a Standalone Page

Already created at `/showcase/past-events`

### As a Component

```tsx
import { PastEventsGallery } from '@/components/showcase/past-events-gallery';

function MyPage() {
  return (
    <PastEventsGallery
      events={myEventsData}
      stats={myStatsData}
      className="my-custom-class"
    />
  );
}
```

## API Endpoints

### GET /api/showcase/past-events

Fetch past events with optional filters.

**Query Parameters:**
- `year` - Filter by year (e.g., "2024")
- `category` - Filter by category (e.g., "Technology")
- `search` - Search in title/location/description
- `featured` - Show only featured events ("true")
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "events": [...],
  "stats": {
    "total_events": 47,
    "total_attendees": 28500,
    "average_rating": 4.8,
    "total_testimonials": 156
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

### POST /api/showcase/past-events

Create new past event showcase (Admin only).

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "date": "2024-03-15",
  "year": 2024,
  "location": "FAST-NUCES, Karachi",
  "category": "Technology",
  "attendees_count": 850,
  "rating": 4.8,
  "featured_image": "https://...",
  "video_url": "https://youtube.com/...",
  "highlights": ["20+ Speakers", "Networking"],
  "is_featured": true,
  "gallery_images": [
    { "url": "https://...", "caption": "Main stage" }
  ],
  "testimonials": [
    {
      "name": "Ahmed Khan",
      "role": "Student",
      "university": "FAST",
      "text": "Amazing event!",
      "rating": 5,
      "is_featured": true
    }
  ]
}
```

## Adding New Past Events

### Via SQL

```sql
-- Add a past event
INSERT INTO past_events_showcase (
  title, description, date, year, location, category,
  attendees_count, rating, featured_image, highlights, is_featured
) VALUES (
  'Your Event Name',
  'Event description',
  '2024-03-15',
  2024,
  'Your Location',
  'Technology',
  500,
  4.8,
  'https://your-image-url.jpg',
  ARRAY['Highlight 1', 'Highlight 2', 'Highlight 3'],
  true
) RETURNING id;

-- Add gallery images (use the ID from above)
INSERT INTO event_gallery (showcase_event_id, image_url, caption, display_order)
VALUES
  ('your-event-id', 'https://image1.jpg', 'Main stage', 1),
  ('your-event-id', 'https://image2.jpg', 'Networking', 2),
  ('your-event-id', 'https://image3.jpg', 'Awards', 3);

-- Add testimonials
INSERT INTO event_testimonials (
  showcase_event_id, attendee_name, attendee_role,
  attendee_university, testimonial_text, rating, is_featured
) VALUES (
  'your-event-id',
  'Ahmed Khan',
  'Student',
  'FAST-NUCES',
  'Amazing event! Learned so much and made great connections.',
  5,
  true
);
```

### Via API (Admin Only)

```bash
curl -X POST http://localhost:3000/api/showcase/past-events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Tech Summit 2024",
    "description": "Amazing tech conference",
    "date": "2024-03-15",
    "year": 2024,
    "location": "FAST-NUCES, Karachi",
    "category": "Technology",
    "attendees_count": 850,
    "rating": 4.8,
    "featured_image": "https://...",
    "highlights": ["20+ Speakers", "Networking"],
    "is_featured": true
  }'
```

## Features

- ✅ Event showcase with images
- ✅ Photo gallery with lightbox
- ✅ Attendee testimonials
- ✅ Statistics dashboard
- ✅ Advanced filtering (year, category, search)
- ✅ Impact metrics section
- ✅ Mobile responsive design
- ✅ Admin-only content creation
- ✅ RLS security policies

## Next Steps

1. Add navigation link to main menu
2. Create admin form for adding events
3. Implement image upload functionality
4. Add video embed support
5. Create social sharing buttons

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify RLS policies are correct
3. Test API endpoints with Postman/curl
4. Check browser console for errors
