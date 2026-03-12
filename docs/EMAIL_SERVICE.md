# FSTIVO Email Service - Complete Documentation

## Overview

The FSTIVO platform uses **Resend** for transactional and marketing emails. The email service is fully integrated with comprehensive templates, API routes, and automated cron jobs.

## Features

- ✅ **11+ Email Templates** - Beautiful, responsive HTML templates
- ✅ **Transactional Emails** - Registration, check-in, reminders, etc.
- ✅ **Authentication Emails** - Welcome, password reset
- ✅ **Bulk Email Support** - Send emails to all event attendees
- ✅ **Volunteer System Emails** - Applications, acceptances, payouts
- ✅ **Automated Reminders** - Cron job sends event reminders automatically
- ✅ **Rate Limiting** - Built-in protection against spam
- ✅ **Email Tracking** - Database logs for sent emails

---

## Quick Setup

### 1. Create Resend Account

1. Go to https://resend.com and sign up
2. Verify your email address
3. Add your domain (e.g., `fstivo.com`)

### 2. Verify Domain

Add these DNS records to your domain provider:

```
Type: TXT
Name: @
Value: [Provided by Resend]

Type: CNAME
Name: resend._domainkey
Value: [Provided by Resend]
```

### 3. Get API Key

1. Go to Resend Dashboard → API Keys
2. Create API Key with "Sending access"
3. Copy the key (starts with `re_`)

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Job Security
CRON_SECRET=generate_random_secret_here
```

### 5. Deploy

```bash
# Push to production
git push origin main

# If using Vercel, cron jobs are automatically configured
```

---

## Email Templates

### 1. Registration Confirmation
**Route:** `POST /api/emails/send-registration-confirmation`

Sends a confirmation email with:
- Event details (date, time, location)
- Registration number
- Ticket type and amount paid
- QR code for check-in

```typescript
await emailClient.sendRegistrationConfirmation(registrationId)
```

### 2. Check-in Confirmation
**Route:** `POST /api/emails/send-checkin-confirmation`

Sent when attendee checks in:
- Check-in time
- Registration number
- Event details

```typescript
await emailClient.sendCheckinConfirmation(registrationId)
```

### 3. Event Reminder
**Route:** `POST /api/emails/send-event-reminder`

Sent at scheduled intervals:
- 1 week before event
- 1 day before event
- 1 hour before event

```typescript
await emailClient.sendEventReminder(registrationId, '1day')
```

### 4. Volunteer Application Confirmation
**Route:** `POST /api/emails/send-volunteer-application-confirmation`

Sent when someone applies to volunteer:
- Event name
- Application date
- Points offered

```typescript
await emailClient.sendVolunteerApplicationConfirmation(applicationId)
```

### 5. Volunteer Acceptance
**Route:** `POST /api/emails/send-volunteer-acceptance`

Sent when volunteer is accepted:
- Role details
- Event date/time
- Training information

```typescript
await emailClient.sendVolunteerAcceptance(applicationId)
```

### 6. Payout Confirmation
**Route:** `POST /api/emails/send-payout-confirmation`

Sent when payout is processed:
- Amount paid
- Payment method
- Reference number

```typescript
await emailClient.sendPayoutConfirmation(payoutId)
```

### 7. Welcome Email
**Route:** `POST /api/emails/send-welcome`

Sent after user registration:
- Welcome message
- Email verification link
- Getting started tips

```typescript
await emailClient.sendWelcome(email, userName)
```

### 8. Password Reset
**Route:** `POST /api/emails/send-password-reset`

Sent when user requests password reset:
- Reset link
- Expiry time
- Security notice

```typescript
await emailClient.sendPasswordReset(email, resetToken)
```

### 9. Bulk Email
**Route:** `POST /api/emails/send-bulk-email`

Send custom message to all event attendees:
- Custom subject and message
- Organizer name
- Batch sending (100 emails per batch)

```typescript
await emailClient.sendBulkEmail({
  eventId,
  subject: 'Important Update',
  message: 'Event venue has changed...',
  organizerName: 'John Doe'
})
```

---

## Automated Reminders (Cron Job)

### How It Works

The cron job runs every hour (`0 * * * *`) and checks for:

1. **Events in 7 days** → Sends 1-week reminder
2. **Events in 1 day** → Sends 1-day reminder
3. **Events in 1 hour** → Sends 1-hour reminder

### Cron Endpoint

```
GET /api/cron/event-reminders
Authorization: Bearer CRON_SECRET
```

### Manual Trigger (Testing)

```
POST /api/cron/event-reminders
```

### Vercel Configuration

The `vercel.json` file includes:

```json
{
  "crons": [
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Testing Email Service

### Test Email Endpoint

**Route:** `POST /api/emails/send-test`

Send a test email to verify configuration:

```bash
curl -X POST https://your-domain.com/api/emails/send-test \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

### Test from Frontend

```typescript
import { emailClient } from '@/lib/emailClient'

const result = await emailClient.sendTest('your@email.com')
console.log(result)
```

---

## Frontend Integration

### Import the Email Client

```typescript
import { emailClient } from '@/lib/emailClient'
```

### After Event Registration

```typescript
// In your registration success handler
const handleRegistrationSuccess = async (registrationId: string) => {
  // Send confirmation email
  await emailClient.sendRegistrationConfirmation(registrationId)

  toast.success('Registration confirmed! Check your email.')
}
```

### After Check-in

```typescript
// In your check-in scanner
const handleCheckIn = async (registrationId: string) => {
  // Process check-in
  await updateRegistration(registrationId, { checked_in: true })

  // Send confirmation email
  await emailClient.sendCheckinConfirmation(registrationId)

  toast.success('Checked in successfully!')
}
```

### Send Bulk Email

```typescript
// In your event management dashboard
const handleBulkEmail = async () => {
  const result = await emailClient.sendBulkEmail({
    eventId: event.id,
    subject: 'Event Update',
    message: 'The venue has changed to...',
    organizerName: user.name
  })

  if (result.success) {
    toast.success(`Sent to ${result.result.recipientCount} attendees`)
  }
}
```

---

## Email Service Class

Located at: `src/lib/emailService.ts`

### Available Methods

```typescript
class EmailService {
  // Transactional Emails
  sendRegistrationConfirmation(email: string, data: RegistrationData)
  sendCheckinConfirmation(email: string, data: CheckinData)
  sendEventReminder(email: string, data: ReminderData)
  sendVolunteerApplicationConfirmation(email: string, data: ApplicationData)
  sendVolunteerAcceptance(email: string, data: AcceptanceData)
  sendPayoutConfirmation(email: string, data: PayoutData)

  // Authentication Emails
  sendWelcomeEmail(email: string, data: WelcomeData)
  sendPasswordReset(email: string, data: ResetData)

  // Bulk Email
  sendBulkEmail(emails: string[], data: BulkEmailData)
}

// Export singleton instance
export const emailService = new EmailService()
```

---

## Database Schema for Email Tracking

### Add to Registrations Table

```sql
ALTER TABLE registrations
ADD COLUMN confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN confirmation_email_sent_at TIMESTAMPTZ,
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_sent_at TIMESTAMPTZ,
ADD COLUMN checkin_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN checkin_email_sent_at TIMESTAMPTZ;
```

### Add to Volunteer Applications Table

```sql
ALTER TABLE volunteer_applications
ADD COLUMN application_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN application_email_sent_at TIMESTAMPTZ,
ADD COLUMN acceptance_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN acceptance_email_sent_at TIMESTAMPTZ;
```

### Add to Payouts Table

```sql
ALTER TABLE payouts
ADD COLUMN confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN confirmation_email_sent_at TIMESTAMPTZ;
```

### Create Email Logs Table (Optional)

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'registration', 'bulk', 'reminder', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL, -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

---

## Troubleshooting

### Emails Not Sending

**Check:**
1. Is `RESEND_API_KEY` set correctly?
2. Is domain verified in Resend?
3. Check browser console for errors
4. Check server logs

**Test API Key:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"noreply@yourdomain.com","to":"test@example.com","subject":"Test","html":"Test"}'
```

### Emails Going to Spam

**Solutions:**
1. Complete domain verification (SPF, DKIM, DMARC)
2. Use your own domain (not @resend.dev)
3. Add unsubscribe link
4. Avoid spam trigger words
5. Warm up domain (start with low volume)

### Cron Job Not Running

**Check:**
1. Is `vercel.json` configured correctly?
2. Is `CRON_SECRET` set?
3. Check Vercel cron logs
4. Manual trigger: `POST /api/cron/event-reminders`

### Rate Limiting

If you hit rate limits:
1. Implement batch sending (already done)
2. Add delays between batches
3. Use email queue system
4. Upgrade Resend plan

---

## Pricing & Limits

### Resend Pricing

| Plan | Cost | Emails/Month | Features |
|------|------|--------------|----------|
| Free | $0 | 3,000 | Basic features |
| Pro | $20 | 50,000 | All features |
| Enterprise | Custom | Unlimited | Custom support |

### FSTIVO Projected Usage

**Year 1:**
- 200 events
- 10,000 users
- ~30,000 emails/month
- **Cost:** $20/month ✅

**Year 2:**
- 1,000 events
- 50,000 users
- ~150,000 emails/month
- **Cost:** $80/month ✅

---

## Security Best Practices

### 1. Never Commit API Keys

Always use environment variables:

```typescript
// ✅ Good
const resend = new Resend(process.env.RESEND_API_KEY)

// ❌ Bad
const apiKey = 're_123456...'
```

### 2. Validate Email Addresses

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!emailRegex.test(email)) {
  throw new Error('Invalid email address')
}
```

### 3. Use Service Role Key for Server-Side

```typescript
// Server-side: Use service role key
const supabase = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Client-side: Use anon key
const supabase = createClient(
  url,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### 4. Rate Limiting

The cron job naturally rate limits by:
- Processing one event at a time
- Adding 1-second delays between batches
- Maximum 100 emails per batch

---

## API Reference

### All Email Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/emails/send-registration-confirmation` | POST | Registration confirmation |
| `/api/emails/send-checkin-confirmation` | POST | Check-in confirmation |
| `/api/emails/send-event-reminder` | POST | Event reminder |
| `/api/emails/send-volunteer-application-confirmation` | POST | Volunteer application received |
| `/api/emails/send-volunteer-acceptance` | POST | Volunteer accepted |
| `/api/emails/send-payout-confirmation` | POST | Payout confirmation |
| `/api/emails/send-welcome` | POST | Welcome email |
| `/api/emails/send-password-reset` | POST | Password reset |
| `/api/emails/send-bulk-email` | POST | Bulk email to attendees |
| `/api/emails/send-test` | POST | Test email |
| `/api/cron/event-reminders` | GET/POST | Cron job endpoint |

### Request/Response Format

**Registration Confirmation:**
```json
// Request
{
  "registrationId": "uuid"
}

// Response
{
  "success": true,
  "message": "Registration confirmation email sent successfully"
}
```

**Bulk Email:**
```json
// Request
{
  "eventId": "uuid",
  "subject": "Event Update",
  "message": "The venue has changed..."
}

// Response
{
  "success": true,
  "message": "Bulk email sent successfully to 150 recipients",
  "recipientCount": 150
}
```

---

## File Structure

```
src/
├── lib/
│   ├── emailService.ts          # Main email service class
│   ├── emailClient.ts           # Frontend client utility
│   └── email/
│       ├── index.ts             # Email exports
│       ├── templates.ts         # All email templates
│       └── send.ts              # Email sending utilities
│   └── cron/
│       └── eventReminderCron.ts # Cron job logic
└── app/
    └── api/
        ├── emails/
        │   ├── send-registration-confirmation/
        │   ├── send-checkin-confirmation/
        │   ├── send-event-reminder/
        │   ├── send-volunteer-application-confirmation/
        │   ├── send-volunteer-acceptance/
        │   ├── send-payout-confirmation/
        │   ├── send-welcome/
        │   ├── send-password-reset/
        │   ├── send-bulk-email/
        │   └── send-test/
        └── cron/
            └── event-reminders/
```

---

## Support & Resources

### Resend Documentation
- Official Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Email Templates: https://resend.com/templates

### Troubleshooting Help
- Email: support@resend.com
- Discord: https://resend.com/discord
- Status Page: https://status.resend.com

### FSTIVO Support
- Email: dev@fstivo.com
- Issues: GitHub Issues

---

## Changelog

### Version 1.0 (Current)
- ✅ 11+ email templates
- ✅ Complete API routes
- ✅ Automated cron job
- ✅ Bulk email support
- ✅ Volunteer system emails
- ✅ Authentication emails
- ✅ Comprehensive documentation

---

## Next Steps

1. **Set up Resend account** → https://resend.com
2. **Verify your domain** → Add DNS records
3. **Configure environment variables** → `.env.local`
4. **Test email sending** → Use test endpoint
5. **Deploy to production** → Push to Vercel
6. **Monitor email delivery** → Check Resend dashboard

---

**Generated with ❤️ for FSTIVO Platform**
