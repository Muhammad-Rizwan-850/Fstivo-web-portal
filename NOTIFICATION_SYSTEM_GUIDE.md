# 🔔 FSTIVO Notification System - Implementation Guide

## Overview

A complete multi-channel notification system for FSTIVO with support for:
- ✅ **Email** (via Resend)
- ✅ **SMS** (via Twilio - optional)
- ✅ **Push Notifications** (Web Push API)
- ✅ **WhatsApp** (via Twilio - optional)

## Table of Contents

1. [Installation](#installation)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [UI Components](#ui-components)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Installation

### Step 1: Install Dependencies

```bash
# Resend (Email)
npm install resend@latest

# Optional: Twilio (SMS/WhatsApp)
npm install twilio

# Optional: Web Push
npm install web-push
```

### Step 2: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy the contents of `supabase/migrations/20250102_notification_system.sql`
3. Execute the SQL script

This will create:
- 10 notification tables
- 2 helper functions
- RLS policies
- Default notification types and channels

---

## Database Setup

### Tables Created

| Table | Purpose |
|-------|---------|
| `notification_channels` | Available channels (email, sms, push, whatsapp) |
| `notification_types` | Notification categories and types |
| `user_notification_preferences` | User settings per type/channel |
| `user_contact_verification` | Verified contact methods |
| `notification_templates` | Reusable message templates |
| `notification_queue` | Pending notifications |
| `notification_log` | Complete history |
| `event_reminders` | Scheduled event reminders |
| `push_subscriptions` | Web push tokens |
| `user_notification_settings` | Global settings + quiet hours |

### Verify Installation

```sql
-- Check if tables exist
SELECT COUNT(*) FROM notification_channels; -- Should return 4
SELECT COUNT(*) FROM notification_types;    -- Should return 20
```

---

## Environment Configuration

### Required Variables

```bash
# Email (Required)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@fstivo.com
```

### Optional Variables

```bash
# SMS/WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62i...
VAPID_PRIVATE_KEY=UUxI4O8...
VAPID_SUBJECT=mailto:admin@fstivo.com

# Development
DEV_LOG_NOTIFICATIONS=true
```

See `NOTIFICATION_SYSTEM_ENV.md` for full details.

---

## API Endpoints

### 1. Send Notification

```typescript
POST /api/notifications/send
```

**Request:**
```json
{
  "notificationType": "event_reminder_1day",
  "channels": ["email", "push"],
  "data": {
    "user_name": "John Doe",
    "event_name": "Tech Summit 2026",
    "event_date": "January 15, 2026",
    "event_time": "10:00 AM",
    "event_venue": "Convention Center"
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "channel": "email",
      "messageId": "resend_msg_id"
    },
    {
      "success": true,
      "channel": "push",
      "messageId": "push_123456"
    }
  ]
}
```

### 2. Get Preferences

```typescript
GET /api/notifications/preferences
```

**Response:**
```json
{
  "preferences": {
    "event": [...],
    "ticket": [...]
  },
  "settings": {
    "global_enabled": true,
    "quiet_hours_enabled": false
  },
  "contacts": [...]
}
```

### 3. Update Preferences

```typescript
PUT /api/notifications/preferences
```

**Request:**
```json
{
  "preferences": [
    {
      "notificationType": "event_reminder_1day",
      "channel": "email",
      "enabled": true
    }
  ],
  "settings": {
    "quiet_hours_enabled": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }
}
```

### 4. Get Notification History

```typescript
GET /api/notifications/history?limit=50&offset=0
```

### 5. Subscribe to Push

```typescript
POST /api/notifications/push/subscribe
```

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "BEl62i...",
      "auth": "tBHI..."
    }
  }
}
```

---

## Usage Examples

### Send Event Reminder

```typescript
import { notificationService } from '@/lib/notifications/service';

// Schedule reminders for event
await notificationService.scheduleEventReminders(
  eventId,
  userId,
  new Date('2026-01-15T10:00:00')
);

// This creates 3 automatic reminders:
// - 1 day before
// - 1 hour before
// - Event starting now
```

### Send Custom Notification

```typescript
await notificationService.send({
  userId: 'user-123',
  notificationType: 'ticket_purchased',
  data: {
    user_name: 'John',
    event_name: 'Tech Summit',
    ticket_count: 2,
    total_amount: 'PKR 5,000'
  },
  priority: 'high',
  channels: ['email', 'push']
});
```

### Get User Preferences

```typescript
const response = await fetch('/api/notifications/preferences');
const { preferences, settings, contacts } = await response.json();
```

---

## UI Components

### Preferences Page

Access at: `/notifications/preferences`

Features:
- Toggle notifications by type and channel
- Configure quiet hours
- Verify contact methods
- Global enable/disable

### History Page

Access at: `/notifications/history`

Features:
- View all sent notifications
- Filter by channel and status
- Analytics dashboard
- Export functionality

---

## Testing

### Development Mode

Set `DEV_LOG_NOTIFICATIONS=true` in `.env.local` to log notifications instead of sending them:

```bash
# .env.local
DEV_LOG_NOTIFICATIONS=true
```

This will:
- Log email content to console
- Skip actual API calls
- Save to notification_log table

### Test Sending Notifications

```bash
# Using curl
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "notificationType": "event_reminder_1day",
    "data": {
      "user_name": "Test User",
      "event_name": "Test Event"
    }
  }'
```

### Verify Database

```sql
-- Check notification log
SELECT * FROM notification_log
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 10;

-- Check user preferences
SELECT * FROM get_user_notification_preferences('your-user-id');
```

---

## Deployment

### Prerequisites

1. **Resend Account**
   - Sign up at https://resend.com
   - Verify your domain
   - Create API key
   - Add to environment variables

2. **Optional: Twilio Account** (for SMS/WhatsApp)
   - Sign up at https://www.twilio.com
   - Get phone numbers
   - Add credentials to environment

3. **Optional: VAPID Keys** (for Web Push)
   ```bash
   npx web-push generate-vapid-keys
   ```
   Add output to environment variables

### Environment Variables Checklist

```bash
✅ RESEND_API_KEY
✅ RESEND_FROM_EMAIL
✅ NEXT_PUBLIC_APP_URL
⚪ TWILIO_ACCOUNT_SID (optional)
⚪ TWILIO_AUTH_TOKEN (optional)
⚪ VAPID keys (optional)
```

### Database Migration

The migration file is located at:
```
supabase/migrations/20250102_notification_system.sql
```

Run this in your Supabase SQL Editor before deploying.

---

## Troubleshooting

### Notifications Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify domain is verified in Resend
3. Check user preferences are enabled
4. Verify contact is verified (for SMS/WhatsApp)
5. Check quiet hours settings

### Push Notifications Not Working

1. Verify VAPID keys are correct
2. Check service worker is registered
3. Ensure user granted permission
4. Verify subscription is saved in database

### Email Not Delivered

1. Check Resend dashboard for errors
2. Verify domain is verified
3. Check spam folder
4. Verify email address format

### Development Mode Issues

If you see "Supabase not configured" errors:

1. Check `.env.local` exists
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
3. Restart development server

---

## Best Practices

### 1. Notification Frequency
- Don't overwhelm users
- Respect quiet hours
- Batch similar notifications
- Allow granular control

### 2. Message Quality
- Clear, concise subject lines
- Actionable content
- Personalization
- Mobile-friendly

### 3. Performance
- Queue notifications for bulk sending
- Use database indexes
- Cache user preferences
- Optimize queries

### 4. Security
- Verify contacts before sending
- Rate limit API endpoints
- Sanitize user input
- Use RLS policies

---

## Support & Resources

- **Resend Docs**: https://resend.com/docs
- **Twilio Docs**: https://www.twilio.com/docs
- **Web Push Docs**: https://web.dev/push-notifications/
- **Supabase Docs**: https://supabase.com/docs

---

## Status: ✅ Production Ready

All components implemented and ready for deployment!
