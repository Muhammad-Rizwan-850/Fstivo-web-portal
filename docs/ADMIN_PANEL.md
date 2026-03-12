# FSTIVO Admin Panel - Complete Documentation

## Overview

The FSTIVO Admin Panel provides a comprehensive platform management interface for administrators to moderate events, manage users, track financials, and configure system settings.

---

## Features

### Dashboard
- **Platform Statistics** - Overview of users, events, revenue, universities
- **Growth Metrics** - Visual growth indicators
- **Recent Activity** - Admin activity log
- **Real-time Analytics** - Live data updates

### User Management
- **User List** - View all registered users
- **Search & Filter** - Find users by name, email, status
- **User Actions** - Suspend, ban, activate users
- **Role Management** - Assign admin roles
- **Export** - Download user data

### Event Moderation
- **Pending Events** - Review awaiting events
- **Approve/Reject** - Moderate event submissions
- **Event Details** - View attendee counts, revenue
- **Bulk Actions** - Process multiple events

### Transactions
- **Transaction History** - View all payments
- **Status Tracking** - Completed, pending, failed
- **Revenue Reports** - Financial analytics
- **Export Reports** - Download financial data

### Universities
- **University List** - Partner institutions
- **Statistics** - Events, users, revenue per university
- **Management** - Activate/deactivate partners

---

## Quick Start

### 1. Run Migration

```bash
# Apply admin system migration
supabase migration up --file supabase/migrations/006_admin_system.sql

# Or manually in Supabase SQL Editor
# Copy contents of 006_admin_system.sql
```

### 2. Create First Admin

Run in Supabase SQL Editor:

```sql
-- Replace with your user ID
INSERT INTO admin_permissions (user_id, role)
VALUES ('your-user-uuid-here', 'super_admin');

-- Also update user profile
UPDATE user_profiles
SET admin_role = 'super_admin'
WHERE id = 'your-user-uuid-here';
```

### 3. Access Admin Panel

Navigate to: `https://your-domain.com/admin`

---

## Database Schema

### Tables Created

#### 1. `admin_permissions`
Stores admin role assignments and permissions.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → auth.users)
- role: 'super_admin' | 'admin' | 'moderator'
- permissions: JSONB
- granted_by: UUID
- granted_at: TIMESTAMPTZ
```

#### 2. `admin_activity_log`
Tracks all admin actions for audit purposes.

```sql
- id: UUID (primary key)
- admin_id: UUID (foreign key → auth.users)
- action: TEXT
- target_type: TEXT
- target_id: UUID
- details: JSONB
- ip_address: TEXT
- created_at: TIMESTAMPTZ
```

#### 3. `system_settings`
Platform-wide configuration settings.

```sql
- id: UUID (primary key)
- key: TEXT (unique)
- value: JSONB
- description: TEXT
- category: TEXT
- updated_by: UUID
- updated_at: TIMESTAMPTZ
```

#### 4. `scheduled_reports`
Automated report generation.

```sql
- id: UUID (primary key)
- name: TEXT
- report_type: 'revenue' | 'users' | 'events' | 'transactions'
- frequency: 'daily' | 'weekly' | 'monthly'
- recipients: TEXT[]
- is_active: BOOLEAN
- next_run_at: TIMESTAMPTZ
```

### Columns Added to Existing Tables

#### `user_profiles`
- `admin_role` - Admin role assignment
- `account_status` - 'active' | 'suspended' | 'banned'
- `status_updated_at` - Last status change
- `status_updated_by` - Who changed status
- `deleted_at` - Soft delete timestamp

#### `events`
- `moderated_at` - When event was moderated
- `moderated_by` - Admin who moderated
- `moderation_reason` - Reason for action

---

## API Routes

### GET `/api/admin/stats`
Get platform statistics.

**Response:**
```json
{
  "totalUsers": 15420,
  "totalEvents": 856,
  "totalRevenue": 12500000,
  "totalUniversities": 124,
  "activeUsers": 14250,
  "pendingEvents": 12,
  "publishedEvents": 844,
  "growth": {
    "users": 12,
    "events": 8,
    "revenue": 25,
    "universities": 5
  }
}
```

### GET `/api/admin/users`
List users with pagination.

**Query Params:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search query
- `status` - Filter by status

**Response:**
```json
{
  "users": [...],
  "total": 15420,
  "page": 1,
  "limit": 50
}
```

### PATCH `/api/admin/users`
Update user status.

**Body:**
```json
{
  "userId": "uuid",
  "action": "suspend" | "ban" | "activate"
}
```

### GET `/api/admin/events`
List events for moderation.

**Query Params:**
- `status` - Filter by status (all, pending, published, rejected)
- `page` - Page number
- `limit` - Items per page

### PATCH `/api/admin/events`
Moderate event (approve/reject).

**Body:**
```json
{
  "eventId": "uuid",
  "action": "approve" | "reject",
  "reason": "Optional reason for rejection"
}
```

---

## Component Usage

### Basic Usage

```tsx
import { AdminPanel } from '@/components/features/admin-panel'

export default function AdminPage() {
  return <AdminPanel />
}
```

### With Custom Access Check

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/admin/adminAuth'
import { AdminPanel } from '@/components/features/admin-panel'

export default function ProtectedAdminPage() {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const access = await isAdmin(user.id)

    if (!access) {
      router.push('/dashboard')
      alert('Access denied')
      return
    }

    setHasAccess(true)
    setLoading(false)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return hasAccess ? <AdminPanel /> : null
}
```

---

## Admin Utilities

### Check if User is Admin

```typescript
import { isAdmin } from '@/lib/admin/adminAuth'

const hasAccess = await isAdmin(userId)
```

### Check Specific Role

```typescript
import { hasAdminRole } from '@/lib/admin/adminAuth'

// Check if user is at least an admin
const isAtLeastAdmin = await hasAdminRole(userId, 'admin')
```

### Update User Status

```typescript
import { updateUserStatus } from '@/lib/admin/adminAuth'

await updateUserStatus(
  userId,
  'suspended',
  adminId
)
```

### Moderate Event

```typescript
import { moderateEvent } from '@/lib/admin/adminAuth'

await moderateEvent(
  eventId,
  'reject',
  moderatorId,
  'Inappropriate content'
)
```

### Log Activity

```typescript
import { logAdminActivity } from '@/lib/admin/adminAuth'

await logAdminActivity(
  adminId,
  'user_banned',
  'user',
  userId,
  { reason: 'Multiple violations' }
)
```

---

## Role Hierarchy

### Super Admin
- Full system access
- Manage other admins
- System settings
- Financial reports
- All user actions

### Admin
- User management
- Event moderation
- View reports
- Cannot manage admins
- Cannot change system settings

### Moderator
- Event approval/rejection
- View reports
- Cannot manage users
- Cannot access sensitive data

### Permissions Matrix

| Action | Super Admin | Admin | Moderator |
|--------|-------------|-------|-----------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ |
| Suspend/Ban Users | ✅ | ✅ | ❌ |
| Approve Events | ✅ | ✅ | ✅ |
| Delete Events | ✅ | ✅ | ❌ |
| View Transactions | ✅ | ✅ | ❌ |
| Generate Reports | ✅ | ✅ | ❌ |
| Manage Admins | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| View Activity Log | ✅ | ✅ | ✅ |

---

## Security Best Practices

### 1. Always Verify Admin Status

```typescript
// ❌ Bad - No verification
const handleUserAction = async (userId) => {
  await suspendUser(userId)
}

// ✅ Good - Verify admin first
const handleUserAction = async (userId) => {
  const isAdminUser = await isAdmin(currentUser.id)

  if (!isAdminUser) {
    throw new Error('Unauthorized')
  }

  await suspendUser(userId)
  await logAdminActivity(currentUser.id, 'suspend_user', 'user', userId)
}
```

### 2. Use Server Actions for Sensitive Operations

```typescript
// app/actions/admin.ts
'use server'

import { updateUserStatus } from '@/lib/admin/adminAuth'
import { revalidatePath } from 'next/cache'

export async function suspendUserAction(userId: string) {
  const result = await updateUserStatus(userId, 'suspended', adminId)

  if (result.success) {
    revalidatePath('/admin/users')
  }

  return result
}
```

### 3. Implement Rate Limiting

```typescript
// lib/rateLimit.ts
const rateLimit = new Map()

export function checkRateLimit(identifier: string, limit = 100) {
  const now = Date.now()
  const requests = rateLimit.get(identifier) || []

  // Remove old requests
  const validRequests = requests.filter((time: number) => now - time < 60000)

  if (validRequests.length >= limit) {
    return false
  }

  validRequests.push(now)
  rateLimit.set(identifier, validRequests)
  return true
}
```

### 4. Log All Admin Actions

```typescript
// Every admin action should be logged
await logAdminActivity(
  adminId,
  'delete_event',
  'event',
  eventId,
  { reason: 'Policy violation' }
)
```

---

## System Settings

### Available Settings

| Key | Value | Description |
|-----|-------|-------------|
| `platform_name` | "FSTIVO" | Platform name |
| `platform_url` | URL | Platform URL |
| `support_email` | Email | Support email |
| `commission_rate` | Number | Platform fee % |
| `require_email_verification` | Boolean | Email verification required |
| `require_event_approval` | Boolean | Events need approval |
| `enable_2fa_for_admins` | Boolean | Force 2FA for admins |
| `max_file_size_mb` | Number | Upload limit |
| `max_events_per_user` | Number | User event limit |

### Update Settings

```typescript
import { updateSystemSetting } from '@/lib/admin/adminAuth'

await updateSystemSetting(
  'commission_rate',
  7,
  adminId
)
```

---

## Activity Logging

All admin actions are automatically logged to `admin_activity_log`.

### Activity Types

- `user_banned` - User banned
- `user_suspended` - User suspended
- `user_activated` - User activated
- `event_approved` - Event approved
- `event_rejected` - Event rejected
- `event_deleted` - Event deleted
- `setting_updated` - Setting changed
- `admin_granted` - Admin role assigned
- `admin_revoked` - Admin role removed

### View Activity Log

```typescript
import { getAdminActivityLog } from '@/lib/admin/adminAuth'

// Get recent activity
const activities = await getAdminActivityLog(undefined, 50)

// Get specific admin's activity
const adminActivities = await getAdminActivityLog(adminId, 100)
```

---

## Troubleshooting

### Issue: Admin panel shows "Access denied"

**Solution:**
```sql
-- Check if user has admin role
SELECT * FROM admin_permissions WHERE user_id = 'your-user-id';

-- If not found, add admin role
INSERT INTO admin_permissions (user_id, role)
VALUES ('your-user-id', 'super_admin');
```

### Issue: Actions not being logged

**Solution:**
```sql
-- Check if RLS is blocking inserts
SELECT * FROM pg_policies
WHERE tablename = 'admin_activity_log';

-- Ensure policy allows inserts
```

### Issue: Stats showing zero

**Solution:**
```sql
-- Check if RPC function exists
SELECT * FROM pg_proc WHERE proname = 'get_platform_stats';

-- Recreate if missing (see migration file)
```

---

## Testing

### Test Admin Access

```typescript
import { isAdmin, hasAdminRole } from '@/lib/admin/adminAuth'

// Test basic admin access
console.log(await isAdmin(userId)) // true/false

// Test role hierarchy
console.log(await hasAdminRole(userId, 'moderator')) // true
console.log(await hasAdminRole(userId, 'admin')) // false
```

### Test User Status

```typescript
import { updateUserStatus } from '@/lib/admin/adminAuth'

// Test suspension
const result = await updateUserStatus(testUserId, 'suspended', adminId)
console.log(result.success) // true
```

### Test Event Moderation

```typescript
import { moderateEvent } from '@/lib/admin/adminAuth'

// Test approval
const result = await moderateEvent(testEventId, 'approve', adminId)
console.log(result.success) // true
```

---

## Deployment Checklist

- [ ] Migration applied successfully
- [ ] First admin account created
- [ ] Admin panel accessible at `/admin`
- [ ] Test user suspension works
- [ ] Test event approval works
- [ ] Activity logging functional
- [ ] RLS policies enabled
- [ ] Rate limiting configured
- [ ] All admin routes protected
- [ ] Documentation complete

---

## File Structure

```
src/
├── components/features/
│   └── admin-panel.tsx              # Main admin component
├── lib/
│   └── admin/
│       └── adminAuth.ts             # Admin utilities
└── app/
    └── api/
        └── admin/
            ├── stats/route.ts       # Statistics API
            ├── users/route.ts       # User management API
            └── events/route.ts      # Event moderation API

supabase/
└── migrations/
    └── 006_admin_system.sql         # Database schema
```

---

## Support

For issues or questions:
- Check migration: `supabase/migrations/006_admin_system.sql`
- Check utilities: `src/lib/admin/adminAuth.ts`
- Check component: `src/components/features/admin-panel.tsx`

---

**Generated with ❤️ for FSTIVO Platform**
*Admin Panel v1.0*
