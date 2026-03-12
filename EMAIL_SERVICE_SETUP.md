# FSTIVO EMAIL SERVICE - SETUP GUIDE

Complete email service integration using Resend for transactional and marketing emails.

---

## 📧 OVERVIEW

The Fstivo Email Service provides:

### Transactional Emails
- ✅ Registration confirmations
- ✅ Check-in confirmations
- ✅ Event reminders (1 week, 1 day, 1 hour before)
- ✅ Volunteer application confirmations
- ✅ Volunteer acceptances
- ✅ Payout confirmations
- ✅ Welcome emails
- ✅ Password reset emails

### Bulk Email Features
- ✅ Send announcements to all event registrants
- ✅ Email campaign manager component
- ✅ Organized email templates

### Automation
- ✅ Automated event reminder cron job
- ✅ Async email sending (non-blocking)

---

## 🚀 QUICK SETUP (15 MINUTES)

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### Step 2: Configure Domain

1. In Resend Dashboard, go to Domains
2. Add your domain (e.g., `fstivo.com` or `yourdomain.com`)
3. Add the DNS records provided by Resend to your domain
4. Wait for DNS verification (usually 5-30 minutes)
5. Once verified, note your domain email (e.g., `noreply@yourdomain.com`)

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to production URL when deployed

# Cron Job Security
CRON_SECRET=your_random_secret_here
```

Generate a cron secret:
```bash
openssl rand -base64 32
```

### Step 4: Test Email Service

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/test-email`

3. Enter your email and click "Send Test Email"

4. Check your inbox!

If successful, you'll receive a registration confirmation email.

---

## 📁 FILES CREATED

### Core Service Files
- `src/lib/emailService.ts` - Main email service class with all templates
- `src/lib/emailClient.ts` - Frontend utility functions
- `src/lib/cron/eventReminderCron.ts` - Cron job for automated reminders

### API Routes
- `src/app/api/emails/send-registration-confirmation/route.ts`
- `src/app/api/emails/send-checkin-confirmation/route.ts`
- `src/app/api/emails/send-event-reminder/route.ts`
- `src/app/api/emails/send-bulk-email/route.ts`
- `src/app/api/emails/send-welcome/route.ts`
- `src/app/api/emails/send-password-reset/route.ts`
- `src/app/api/emails/send-volunteer-application-confirmation/route.ts`
- `src/app/api/emails/send-volunteer-acceptance/route.ts`
- `src/app/api/emails/send-payout-confirmation/route.ts`
- `src/app/api/emails/send-test/route.ts`
- `src/app/api/emails/schedule-reminders/route.ts`
- `src/app/api/cron/event-reminders/route.ts`

### Components
- `src/components/features/email-campaign-manager.tsx` - Bulk email UI component

### Pages
- `src/app/test-email/page.tsx` - Test email page

---

## 💡 USAGE EXAMPLES

### Sending Registration Confirmation

**Server Action (Automatic):**
```typescript
// Already integrated in registration-server.ts
// Emails are sent automatically after successful registration
```

**Manual Trigger:**
```typescript
import { emailClient } from '@/lib/emailClient'

const result = await emailClient.sendRegistrationConfirmation('registration_id')
```

### Sending Check-in Confirmation

**Automatic on Check-in:**
```typescript
// Already integrated in checkInAttendeeByRegistrationNumber()
// Emails are sent automatically when attendees check in
```

### Sending Bulk Email to Event Registrants

```typescript
'use client'

import { EmailCampaignManager } from '@/components/features/email-campaign-manager'

export default function EventDashboard({ eventId, eventName }) {
  return (
    <EmailCampaignManager
      eventId={eventId}
      eventName={eventName}
      organizerName="John Doe"
    />
  )
}
```

### Sending Event Reminder Manually

```typescript
import { emailClient } from '@/lib/emailClient'

// Send reminder 1 day before event
await emailClient.sendEventReminder('registration_id', '1day')

// Send reminder 1 hour before event
await emailClient.sendEventReminder('registration_id', '1hour')

// Send reminder 1 week before event
await emailClient.sendEventReminder('registration_id', '1week')
```

---

## ⏰ CRON JOB SETUP

### Option 1: Vercel Cron (Recommended)

1. Create or update `vercel.json`:

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

2. Deploy to Vercel
3. Cron job runs every hour automatically

### Option 2: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org) (Free)
- [EasyCron](https://www.easycron.com)
- [GitHub Actions](https://github.com/features/actions)

**Endpoint:** `https://yourdomain.com/api/cron/event-reminders`
**Method:** GET
**Schedule:** Every hour (`0 * * * *`)
**Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

### Option 3: Manual Trigger

For testing or manual execution:

```bash
curl -X POST https://yourdomain.com/api/cron/event-reminders \
  -H "Content-Type: application/json"
```

---

## 📊 EMAIL TEMPLATES

All email templates are included in `src/lib/emailService.ts`:

### 1. Registration Confirmation
- Event details
- Registration number
- Ticket type
- Amount paid
- Date, time, location
- Link to tickets

### 2. Check-in Confirmation
- Check-in time
- Registration number
- Event name

### 3. Event Reminder
- Event details
- Countdown (1 week/day/hour)
- Registration number
- Location
- Arrival instructions

### 4. Volunteer Application
- Application received confirmation
- Event details
- Application date
- Next steps

### 5. Volunteer Acceptance
- Congratulations message
- Role details
- Event information
- Training date (if applicable)

### 6. Payout Confirmation
- Amount
- Payout date
- Payment method
- Reference number

### 7. Welcome Email
- Welcome message
- Platform features
- Email verification link

### 8. Password Reset
- Reset link
- Expiry time
- Security notice

### 9. Bulk Email
- Custom subject
- Custom message
- Event context
- Organizer signature

---

## 🔧 CUSTOMIZATION

### Modify Email Templates

Edit `src/lib/emailService.ts`:

```typescript
async sendRegistrationConfirmation(email: string, data: {...}) {
  const html = `
    <!-- Your custom HTML here -->
  `
  return await this.sendEmail([email], subject, html)
}
```

### Add New Email Type

1. Add method to `EmailService` class:

```typescript
async sendCustomEmail(email: string, data: any) {
  const subject = 'Your Subject'
  const html = `Your HTML template`
  return await this.sendEmail([email], subject, html)
}
```

2. Create API route in `src/app/api/emails/send-custom/route.ts`

3. Add client function to `src/lib/emailClient.ts`

---

## 🐛 TROUBLESHOOTING

### Emails Not Sending

1. **Check Environment Variables:**
   ```bash
   echo $RESEND_API_KEY
   echo $RESEND_FROM_EMAIL
   ```

2. **Check Logs:**
   - Console logs show `[MOCK]` if Resend is not configured
   - Check browser console for errors

3. **Verify Domain:**
   - Go to Resend Dashboard → Domains
   - Ensure domain status is "Verified"

4. **Test with Test Page:**
   - Go to `/test-email`
   - Send a test email
   - Check result and logs

### Email Goes to Spam

1. **Verify SPF/DKIM Records:**
   - Check domain DNS settings
   - Ensure all Resend DNS records are added

2. **Check Email Content:**
   - Avoid spam trigger words
   - Use plain text alternative
   - Include unsubscribe link for bulk emails

3. **Domain Reputation:**
   - Start with low volume
   - Gradually increase sending rate
   - Monitor bounce rates

---

## 📈 PRODUCTION CHECKLIST

- [x] Resend account created
- [x] API key added to `.env.local`
- [x] Domain verified in Resend
- [x] `RESEND_FROM_EMAIL` set correctly
- [x] `NEXT_PUBLIC_APP_URL` set to production URL
- [x] Test email sent successfully
- [x] Registration email integrated
- [x] Check-in email integrated
- [x] Cron job configured
- [x] `CRON_SECRET` generated and added
- [x] Vercel cron configured (if using Vercel)

---

## 🎯 NEXT STEPS

1. **Add Email Preferences:**
   - Allow users to opt-out of non-essential emails
   - Store preferences in user profile

2. **Email Analytics:**
   - Track open rates
   - Track click rates
   - Monitor bounces

3. **Advanced Templates:**
   - Add event-specific branding
   - Include event logos
   - Add social media links

4. **Drip Campaigns:**
   - Post-event feedback emails
   - Re-engagement campaigns
   - Newsletter subscriptions

---

## 📞 SUPPORT

- **Resend Documentation:** https://resend.com/docs
- **Resend API Reference:** https://resend.com/docs/api-reference
- **Fstivo GitHub:** https://github.com/your-repo

---

*Generated by Fstivo Development Team*
