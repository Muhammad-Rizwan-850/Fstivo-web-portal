# 📧 Resend Domain Verification Guide

Your Resend API key is configured. Now verify your domain to send emails.

---

## Current Status

✅ **API Key:** Configured and working  
⚠️ **Domain:** `fstivo.com` needs verification

---

## 🔧 Domain Verification Steps

### Step 1: Add Domain in Resend

1. **Go to:** https://resend.com/domains
2. **Click:** "Add Domain"
3. **Enter:** `fstivo.com`
4. **Click:** "Add Domain"

### Step 2: Add DNS Records

After adding the domain, Resend will show you DNS records to add. Add these to your domain's DNS:

**For development/testing, you can use Resend's free onboarding domain:**

Update `.env.local` temporarily:
```bash
RESEND_FROM_EMAIL=noreply@onboarding.resend.dev
```

This allows you to send emails immediately while setting up your custom domain.

---

## Option 1: Quick Setup (Use Resend's Domain)

For immediate testing without DNS configuration:

1. **Update .env.local:**
```bash
RESEND_FROM_EMAIL=onboarding@resend.dev
```

2. **Restart dev server:**
```bash
npm run dev
```

3. **Test email sending**

---

## Option 2: Custom Domain Setup (Recommended)

### Add these DNS records to your domain:

```
Type: TXT
Name: resend._domainkey.fstivo.com
Value: p=REDACTED (get from Resend dashboard)

Type: TXT
Name: _dmarc.fstivo.com
Value: v=DMARC1; p=none

Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

### Where to add DNS records:

- **Namecheap:** Advanced DNS
- **GoDaddy:** DNS Management  
- **Cloudflare:** DNS Records
- **Google Domains:** DNS Settings

### After adding records:

1. **Click "Verify"** in Resend dashboard
2. **Wait** for DNS propagation (5-30 minutes)
3. **Status** will change to "Verified"

---

## 🧪 Test Email Sending

Once verified, test with:

```bash
node scripts/test-email.js
```

Or visit the test page:
```
http://localhost:3000/test-email
```

---

## 📊 Dashboard Links

| Purpose | Link |
|---------|------|
| Domains | https://resend.com/domains |
| API Keys | https://resend.com/api-keys |
| Email Logs | https://resend.com/dashboard/emails |
| Analytics | https://resend.com/dashboard/analytics |

---

## ✅ Verification Checklist

- [ ] Domain added in Resend dashboard
- [ ] DNS records added to domain provider
- [ ] DNS propagated (check with: dig TXT fstivo.com)
- [ ] Domain verified in Resend
- [ ] Test email sent successfully

---

**Current Configuration:**
```
API Key: re_gtfts5dY_EmMxvNEiN2WUdUBqdcwrGiTP ✅
From Email: noreply@fstivo.com ⚠️ (pending verification)
```

---

**Quick Fix for Development:**
```bash
# Update .env.local to use Resend's onboarding domain
RESEND_FROM_EMAIL=onboarding@resend.dev
```

This allows immediate email sending without domain verification.
