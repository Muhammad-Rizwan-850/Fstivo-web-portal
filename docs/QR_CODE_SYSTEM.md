# FSTIVO QR Code System

Complete QR code generation, scanning, and check-in system for event tickets and registrations.

## Overview

The QR Code System provides:
- **Digital Tickets** with styled QR codes for event attendees
- **QR Scanner** with camera-based scanning for event check-ins
- **Manual Code Entry** for verifying tickets without scanning
- **Check-in Management** with real-time status updates
- **QR Code Caching** for optimized performance

## Features

### 1. Digital Ticket Display
- Styled QR codes with event branding
- Download, share, and copy functionality
- Calendar integration for events
- Real-time check-in status display

### 2. QR Scanner
- Camera-based QR code scanning using `react-qr-reader`
- Real-time verification and validation
- Visual scanning overlay with target frame
- Error handling for camera access issues

### 3. Manual Code Entry
- Text-based QR code verification
- Useful for backup check-in methods
- Full validation and attendee details

### 4. Check-in Management
- One-click check-in confirmation
- Automatic status updates
- Check-in timestamp tracking
- Prevention of duplicate check-ins

## Installation

The required dependencies are already installed:

```bash
npm install qrcode react-qr-reader
```

## Database Schema

The QR system uses the existing `registrations` table:

```sql
registrations (
  id UUID PRIMARY KEY,
  qr_code TEXT UNIQUE,              -- QR code data (format: FSTIVO-{id}-{hex})
  registration_number TEXT UNIQUE,   -- Human-readable ticket number
  status TEXT,                       -- 'confirmed', 'attended', 'cancelled'
  checked_in_at TIMESTAMPTZ,         -- Check-in timestamp
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  ticket_type_id UUID REFERENCES ticket_types(id)
)
```

## Usage

### Basic QR Code Display

```tsx
import { QRCodeSystem } from '@/components/features/qr-code-system'

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <QRCodeSystem
      registrationId={params.id}
      initialTab="ticket"
    />
  )
}
```

### Event Check-in Scanner

```tsx
import { QRCodeSystem } from '@/components/features/qr-code-system'

export default function CheckInPage() {
  const handleCheckInComplete = (registrationId: string, result: any) => {
    console.log('Checked in:', registrationId, result)
  }

  return (
    <QRCodeSystem
      initialTab="scanner"
      onCheckInComplete={handleCheckInComplete}
    />
  )
}
```

### Manual Verification

```tsx
import { QRCodeSystem } from '@/components/features/qr-code-system'

export default function ManualCheckIn() {
  return <QRCodeSystem initialTab="manual" />
}
```

## API Reference

### Component Props

```typescript
interface QRCodeSystemProps {
  registrationId?: string      // Registration ID for ticket display
  eventId?: string             // Event ID (optional)
  initialTab?: 'ticket' | 'scanner' | 'manual'  // Default active tab
  onCheckInComplete?: (registrationId: string, result: any) => void  // Callback
  className?: string           // Additional CSS classes
}
```

### Server Actions

#### `generateRegistrationQRCodeAction`

Generate QR code for a registration.

```typescript
const result = await generateRegistrationQRCodeAction({
  registration_id: string,
  format?: 'png' | 'svg' | 'dataurl',
  size?: number,
  style?: 'simple' | 'styled'
})
```

**Returns:**
```typescript
{
  success: boolean
  format: string
  data: string  // Base64 encoded QR code
  registration: {
    id: string
    registration_number: string
    event_title: string
  }
}
```

#### `verifyQRCodeAction`

Verify QR code and return registration details.

```typescript
const result = await verifyQRCodeAction(qrData: string)
```

**Returns:**
```typescript
{
  success: boolean
  registration: {
    id: string
    registration_number: string
    status: string
    checked_in_at: string | null
    can_check_in: boolean
    attendee: { name, email, phone, avatar_url }
    event: { id, title, start_date, end_date, venue_name, venue_city }
    ticket_type: { id, name, price }
  }
  canCheckIn: boolean
  isCheckedIn: boolean
}
```

#### `downloadQRCodeAction`

Download QR code as image file.

```typescript
const result = await downloadQRCodeAction(registrationId: string)
```

**Returns:**
```typescript
{
  success: boolean
  downloadUrl: string  // data URL
  filename: string
}
```

#### `generateEventQRCodeBatchAction`

Generate QR codes for all event registrations (organizer only).

```typescript
const result = await generateEventQRCodeBatchAction(eventId: string, {
  size?: number
})
```

## QR Code Format

QR codes follow the format: `FSTIVO-{registration_id}-{random_hex}`

Example: `FSTIVO-550e8400-e29b-41d4-a716-446655440000-a3f2b1c4`

## Utility Functions

### Generation

```typescript
import {
  generateQRCodeDataURL,
  generateQRCodeBuffer,
  generateStyledQRCodeSVG,
  generateRegistrationQRCode
} from '@/lib/qr/generate'

// Generate as data URL (base64)
const dataURL = await generateQRCodeDataURL('FSTIVO-xxx-xxx', {
  width: 300,
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' }
})

// Generate as buffer
const buffer = await generateQRCodeBuffer('FSTIVO-xxx-xxx')

// Generate styled SVG with title
const svg = await generateStyledQRCodeSVG('FSTIVO-xxx-xxx', {
  title: 'Your Ticket',
  subtitle: 'Event Title',
  backgroundColor: '#ffffff',
  borderColor: '#6366f1'
})
```

### Validation

```typescript
import {
  isValidQRCodeData,
  extractRegistrationIdFromQR
} from '@/lib/qr/generate'

// Validate QR code format
const isValid = isValidQRCodeData('FSTIVO-xxx-xxx')

// Extract registration ID
const regId = extractRegistrationIdFromQR('FSTIVO-xxx-xxx')
```

## Examples

### Event Ticket Page

```tsx
// app/events/[eventId]/tickets/[registrationId]/page.tsx
import { QRCodeSystem } from '@/components/features/qr-code-system'

export default function TicketPage({ params }: { params: { registrationId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Ticket</h1>
      <QRCodeSystem registrationId={params.registrationId} />
    </div>
  )
}
```

### Organizer Check-in Dashboard

```tsx
// app/events/[eventId]/check-in/page.tsx
import { QRCodeSystem } from '@/components/features/qr-code-system'

export default function EventCheckInPage() {
  const handleCheckIn = (registrationId: string, result: any) => {
    // Log to analytics, update dashboard, etc.
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Event Check-in</h1>
      <QRCodeSystem
        initialTab="scanner"
        onCheckInComplete={handleCheckIn}
      />
    </div>
  )
}
```

## Styling

The QRCodeSystem component uses Tailwind CSS and shadcn/ui components. It supports:

- Responsive design (mobile, tablet, desktop)
- Dark mode compatibility
- Custom styling via `className` prop

## Security

- **Authentication Required**: All QR operations require user authentication
- **Permission Checks**: Only registrants and event organizers can view QR codes
- **QR Code Validation**: Format validation prevents invalid codes
- **Check-in Authorization**: Only event organizers can verify and check in attendees
- **RLS Policies**: Database Row Level Security protects registration data

## Performance

- **QR Code Caching**: Generated QR codes are cached for fast retrieval
- **Batch Generation**: Organizer can preload all event QR codes
- **Lazy Loading**: QR codes are generated on-demand
- **Optimized Scanning**: Camera scanning uses efficient libraries

## Troubleshooting

### Camera not working

1. Check browser permissions
2. Ensure HTTPS (required for camera access)
3. Try refreshing the page
4. Use manual entry as fallback

### QR code not generating

1. Verify registration exists
2. Check user has permission to view QR code
3. Clear QR code cache
4. Ensure registration status is 'confirmed'

### Check-in failing

1. Verify organizer permissions
2. Check registration status
3. Ensure QR code format is valid
4. Check for duplicate check-in attempts

## Related Files

- `src/lib/qr/generate.ts` - QR code generation utilities
- `src/lib/actions/qr-server.ts` - Server actions for QR operations
- `src/lib/qr/cache.ts` - QR code caching system
- `src/hooks/use-qr-scanner.ts` - QR scanner hook
- `src/components/features/qr-code-system.tsx` - Main component

## Future Enhancements

- [ ] Offline QR code generation
- [ ] NFC ticket support
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Batch check-in from CSV
- [ ] Self-service kiosk mode
