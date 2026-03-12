// ============================================================================
// TEST IMPLEMENTATION TEMPLATES - COPY & CUSTOMIZE FOR EACH FILE
// ============================================================================

// Template 1: Database Query File Tests
// Use for: src/lib/database/queries/*.ts files (seating, affiliate, etc.)

```typescript
// tests/unit/lib/database/queries/seating.test.ts
import { 
  getVenues, 
  createVenue, 
  reserveSeat,
  getSeatingLayout,
  releaseSeatingHold
} from '@/lib/database/queries/seating'
import { createClient } from '@/lib/auth/config'

// Mock the Supabase client
jest.mock('@/lib/auth/config')

const mockClient = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  single: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
}

describe('Seating Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockClient)
    
    // Setup default mock chain
    mockClient.from.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
    mockClient.order.mockReturnValue(mockClient)
    mockClient.limit.mockReturnValue(mockClient)
    mockClient.single.mockReturnValue(mockClient)
  })

  describe('getVenues()', () => {
    it('should fetch all active venues', async () => {
      const mockVenues = [
        { id: 'v1', name: 'Arena A', is_active: true },
        { id: 'v2', name: 'Arena B', is_active: true },
      ]
      mockClient.eq.mockResolvedValueOnce({ data: mockVenues, error: null })

      const result = await getVenues()
      
      expect(result).toEqual(mockVenues)
      expect(mockClient.from).toHaveBeenCalledWith('venues')
      expect(mockClient.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should fetch venues for specific user', async () => {
      const mockVenues = [{ id: 'v1', created_by: 'user_123' }]
      mockClient.eq.mockResolvedValueOnce({ data: mockVenues, error: null })

      const result = await getVenues('user_123')
      
      expect(result).toEqual(mockVenues)
      expect(mockClient.eq).toHaveBeenCalledWith('created_by', 'user_123')
    })

    it('should throw on database error', async () => {
      const error = new Error('Database connection failed')
      mockClient.eq.mockResolvedValueOnce({ data: null, error })

      await expect(getVenues()).rejects.toThrow('Database connection failed')
    })

    it('should handle empty result', async () => {
      mockClient.eq.mockResolvedValueOnce({ data: [], error: null })

      const result = await getVenues()
      
      expect(result).toEqual([])
    })
  })

  describe('createVenue()', () => {
    const venueData = {
      name: 'New Venue',
      capacity: 500,
      address: '123 Main St',
    }

    it('should create venue with valid data', async () => {
      const created = { id: 'v_new', ...venueData, created_at: '2026-02-09' }
      mockClient.insert.mockReturnValue(mockClient)
      mockClient.select.mockResolvedValueOnce({ data: [created], error: null })

      const result = await createVenue(venueData)
      
      expect(result).toEqual(created)
      expect(mockClient.insert).toHaveBeenCalledWith(expect.objectContaining(venueData))
    })

    it('should validate required fields', async () => {
      await expect(createVenue({ name: '' })).rejects.toThrow('Name is required')
    })

    it('should handle duplicate venue error', async () => {
      const error = { code: 'UNIQUE_VIOLATION', message: 'Venue already exists' }
      mockClient.insert.mockReturnValue(mockClient)
      mockClient.select.mockResolvedValueOnce({ data: null, error })

      await expect(createVenue(venueData)).rejects.toThrow('Venue already exists')
    })
  })

  describe('reserveSeat()', () => {
    it('should reserve available seat', async () => {
      const seat = { id: 's1', status: 'available' }
      const reserved = { ...seat, status: 'reserved', reserved_by: 'user_123' }
      
      // Mock get seat
      mockClient.select.mockResolvedValueOnce({ data: [seat], error: null })
      // Mock update
      mockClient.update.mockReturnValue(mockClient)
      mockClient.eq.mockResolvedValueOnce({ data: [reserved], error: null })

      const result = await reserveSeat('seat_1', 'user_123')
      
      expect(result.status).toBe('reserved')
      expect(result.reserved_by).toBe('user_123')
    })

    it('should prevent duplicate reservation', async () => {
      const seat = { id: 's1', status: 'reserved', reserved_by: 'other_user' }
      mockClient.select.mockResolvedValueOnce({ data: [seat], error: null })

      await expect(reserveSeat('seat_1', 'user_123')).rejects.toThrow('Seat already reserved')
    })

    it('should handle seat not found', async () => {
      mockClient.select.mockResolvedValueOnce({ data: [], error: null })

      await expect(reserveSeat('invalid', 'user_123')).rejects.toThrow('Seat not found')
    })

    it('should apply hold timeout', async () => {
      const seat = { id: 's1', status: 'available', hold_expires_at: '2026-02-09T10:00:00' }
      mockClient.select.mockResolvedValueOnce({ data: [seat], error: null })

      // Should check if hold is expired
      const result = await reserveSeat('seat_1', 'user_123')
      expect(result.status).toBe('reserved')
    })
  })

  describe('getSeatingLayout()', () => {
    it('should fetch layout with sections', async () => {
      const layout = {
        id: 'layout_1',
        event_id: 'event_1',
        sections: ['A', 'B', 'C'],
        total_seats: 300,
      }
      mockClient.select.mockResolvedValueOnce({ data: [layout], error: null })

      const result = await getSeatingLayout('layout_1')
      
      expect(result.sections).toHaveLength(3)
      expect(result.total_seats).toBe(300)
    })

    it('should handle missing layout', async () => {
      mockClient.select.mockResolvedValueOnce({ data: [], error: null })

      await expect(getSeatingLayout('invalid')).rejects.toThrow()
    })
  })

  describe('releaseSeatingHold()', () => {
    it('should release expired hold', async () => {
      const hold = { id: 'h1', expires_at: '2026-02-08T10:00:00' } // Past
      mockClient.select.mockResolvedValueOnce({ data: [hold], error: null })
      mockClient.delete.mockResolvedValueOnce({ data: null, error: null })

      await releaseSeatingHold('hold_1')
      
      expect(mockClient.delete).toHaveBeenCalled()
    })

    it('should not release active hold', async () => {
      const hold = { id: 'h1', expires_at: '2026-02-10T10:00:00' } // Future
      mockClient.select.mockResolvedValueOnce({ data: [hold], error: null })

      await expect(releaseSeatingHold('hold_1')).rejects.toThrow('Hold is still active')
    })
  })
})
```

---

// Template 2: Server Action Tests
// Use for: src/lib/actions/*.ts files (events-server, revenue-actions, etc.)

```typescript
// tests/unit/lib/actions/events-server.test.ts
import { 
  searchEvents, 
  getEventDetail, 
  createEvent,
  publishEvent,
  deleteEvent 
} from '@/lib/actions/events-server'
import * as queries from '@/lib/database/queries/events'
import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/auth/config')
jest.mock('@/lib/database/queries/events')
jest.mock('next/cache')
jest.mock('@/lib/logger')

describe('Events Server Actions', () => {
  const mockUser = { id: 'user_123', email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) }
    })
  })

  describe('searchEvents()', () => {
    it('should search with filters', async () => {
      const mockEvents = [
        { id: 'e1', title: 'Concert', category: 'music' },
        { id: 'e2', title: 'Talk', category: 'tech' },
      ]
      ;(queries.searchEvents as jest.Mock).mockResolvedValueOnce(mockEvents)

      const result = await searchEvents({
        search: 'music',
        category: 'music',
        limit: 10,
        page: 1,
      })

      expect(result).toEqual(mockEvents)
      expect(queries.searchEvents).toHaveBeenCalledWith(expect.objectContaining({
        search: 'music',
        category: 'music',
      }))
    })

    it('should support pagination', async () => {
      ;(queries.searchEvents as jest.Mock).mockResolvedValueOnce([])

      await searchEvents({ limit: 20, page: 2 })

      expect(queries.searchEvents).toHaveBeenCalledWith(expect.objectContaining({
        limit: 20,
        offset: 20, // page 2 * limit 20
      }))
    })

    it('should sort by different fields', async () => {
      ;(queries.searchEvents as jest.Mock).mockResolvedValueOnce([])

      await searchEvents({
        sort_by: 'start_date',
        sort_order: 'asc',
      })

      expect(queries.searchEvents).toHaveBeenCalledWith(expect.objectContaining({
        sort_by: 'start_date',
        sort_order: 'asc',
      }))
    })

    it('should validate date range', async () => {
      await expect(searchEvents({
        start_date: '2026-02-10',
        end_date: '2026-02-01', // Invalid: end before start
      })).rejects.toThrow('End date must be after start date')
    })

    it('should handle empty search', async () => {
      ;(queries.searchEvents as jest.Mock).mockResolvedValueOnce([])

      const result = await searchEvents({})

      expect(result).toEqual([])
    })
  })

  describe('getEventDetail()', () => {
    it('should fetch event with full details', async () => {
      const mockEvent = {
        id: 'e1',
        title: 'Test Event',
        description: 'Test',
        registrations: 50,
        capacity: 100,
      }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(mockEvent)

      const result = await getEventDetail('e1')

      expect(result).toEqual(mockEvent)
      expect(queries.getEventById).toHaveBeenCalledWith('e1')
    })

    it('should handle event not found', async () => {
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(null)

      const result = await getEventDetail('invalid')

      expect(result).toBeNull()
    })

    it('should include related data', async () => {
      const mockEvent = {
        id: 'e1',
        title: 'Test Event',
        registrations: [],
        tickets: [],
        seating_layout: {},
      }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(mockEvent)

      const result = await getEventDetail('e1')

      expect(result.registrations).toBeDefined()
      expect(result.tickets).toBeDefined()
      expect(result.seating_layout).toBeDefined()
    })
  })

  describe('createEvent()', () => {
    const eventData = {
      title: 'New Event',
      description: 'Event description',
      start_date: '2026-03-15T10:00:00Z',
      end_date: '2026-03-15T18:00:00Z',
      capacity: 100,
      price: 29.99,
    }

    it('should create event with valid data', async () => {
      const created = { id: 'e_new', ...eventData, status: 'draft' }
      ;(queries.createEvent as jest.Mock).mockResolvedValueOnce(created)

      const result = await createEvent(eventData)

      expect(result.id).toBe('e_new')
      expect(result.status).toBe('draft')
      expect(revalidatePath).toHaveBeenCalledWith('/events')
    })

    it('should validate required fields', async () => {
      await expect(createEvent({ title: '' })).rejects.toThrow('Title is required')
    })

    it('should validate date range', async () => {
      await expect(createEvent({
        ...eventData,
        start_date: '2026-03-15T18:00:00Z',
        end_date: '2026-03-15T10:00:00Z', // Invalid
      })).rejects.toThrow('End date must be after start date')
    })

    it('should require user authentication', async () => {
      ;(createClient as jest.Mock).mockResolvedValueOnce({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }
      })

      await expect(createEvent(eventData)).rejects.toThrow('Unauthorized')
    })

    it('should set organizer from current user', async () => {
      ;(queries.createEvent as jest.Mock).mockResolvedValueOnce({ id: 'e_new', ...eventData })

      await createEvent(eventData)

      expect(queries.createEvent).toHaveBeenCalledWith(expect.objectContaining({
        organizer_id: mockUser.id,
      }))
    })
  })

  describe('publishEvent()', () => {
    it('should publish draft event', async () => {
      const event = { id: 'e1', status: 'draft' }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)
      ;(queries.updateEvent as jest.Mock).mockResolvedValueOnce({ ...event, status: 'published' })

      const result = await publishEvent('e1')

      expect(result.status).toBe('published')
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should require user authorization', async () => {
      const event = { id: 'e1', organizer_id: 'other_user' }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)

      await expect(publishEvent('e1')).rejects.toThrow('Unauthorized')
    })

    it('should validate event before publishing', async () => {
      const event = { id: 'e1', status: 'draft', title: '', organizer_id: mockUser.id }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)

      await expect(publishEvent('e1')).rejects.toThrow('Event title is required')
    })

    it('should not publish already published event', async () => {
      const event = { id: 'e1', status: 'published', organizer_id: mockUser.id }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)

      await expect(publishEvent('e1')).rejects.toThrow('Event is already published')
    })
  })

  describe('deleteEvent()', () => {
    it('should soft delete event', async () => {
      const event = { id: 'e1', status: 'draft', organizer_id: mockUser.id }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)
      ;(queries.updateEvent as jest.Mock).mockResolvedValueOnce({ ...event, status: 'deleted' })

      await deleteEvent('e1')

      expect(queries.updateEvent).toHaveBeenCalledWith('e1', { status: 'deleted' })
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should prevent deletion of published event with registrations', async () => {
      const event = { id: 'e1', status: 'published', organizer_id: mockUser.id, registrations: 10 }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)

      await expect(deleteEvent('e1')).rejects.toThrow('Cannot delete published event with registrations')
    })

    it('should require authorization', async () => {
      const event = { id: 'e1', organizer_id: 'other_user' }
      ;(queries.getEventById as jest.Mock).mockResolvedValueOnce(event)

      await expect(deleteEvent('e1')).rejects.toThrow('Unauthorized')
    })
  })
})
```

---

// Template 3: Utility Function Tests
// Use for: emailService, uploadUtils, CMS, etc.

```typescript
// tests/unit/lib/emailService.test.ts
import { emailService } from '@/lib/emailService'
import { Resend } from 'resend'
import { logger } from '@/lib/logger'

jest.mock('resend')
jest.mock('@/lib/logger')

describe('EmailService', () => {
  const mockResend = Resend as jest.MockedClass<typeof Resend>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendEmail()', () => {
    it('should send email to single recipient', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      const result = await emailService.sendEmail(
        ['user@example.com'],
        'Test Subject',
        '<p>Test content</p>'
      )

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test Subject',
      }))
      expect(result.success).toBe(true)
    })

    it('should send to multiple recipients', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email_' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendEmail(
        ['user1@example.com', 'user2@example.com'],
        'Subject',
        '<p>content</p>'
      )

      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('should mock when API key is missing', async () => {
      delete process.env.RESEND_API_KEY
      
      const result = await emailService.sendEmail(
        ['user@example.com'],
        'Test',
        'Content'
      )

      expect(result.mock).toBe(true)
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('MOCK'))
    })

    it('should handle Resend API error', async () => {
      const mockSend = jest.fn().mockRejectedValueOnce(new Error('API error'))
      mockResend.prototype.emails = { send: mockSend }

      await expect(emailService.sendEmail(
        ['user@example.com'],
        'Subject',
        'Content'
      )).rejects.toThrow('API error')
    })
  })

  describe('sendVerificationEmail()', () => {
    it('should send verification email with token', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendVerificationEmail('user@example.com', 'token_abc')

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Verify'),
        html: expect.stringContaining('token_abc'),
      }))
    })

    it('should generate verification link', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendVerificationEmail('user@example.com', 'token_123')

      const call = mockSend.mock.calls[0][0]
      expect(call.html).toMatch(/verify|confirm/i)
    })
  })

  describe('sendPasswordResetEmail()', () => {
    it('should send reset email with token', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendPasswordResetEmail('user@example.com', 'reset_token_123')

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Reset'),
      }))
    })

    it('should include reset link with token', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendPasswordResetEmail('user@example.com', 'token_xyz')

      const html = mockSend.mock.calls[0][0].html
      expect(html).toMatch(/reset|password/i)
      expect(html).toContain('token_xyz')
    })
  })

  describe('sendEventRegistrationEmail()', () => {
    const eventData = {
      title: 'Test Event',
      start_date: '2026-03-15T10:00:00Z',
      location: 'Test Venue',
    }
    const ticketCode = 'TICKET_123'

    it('should send registration confirmation', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendEventRegistrationEmail('user@example.com', eventData, ticketCode)

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Confirmed'),
      }))
    })

    it('should include event details and ticket code', async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({ id: 'email_123' })
      mockResend.prototype.emails = { send: mockSend }

      await emailService.sendEventRegistrationEmail('user@example.com', eventData, ticketCode)

      const html = mockSend.mock.calls[0][0].html
      expect(html).toContain(eventData.title)
      expect(html).toContain(ticketCode)
    })
  })

  describe('sendBulkEmail()', () => {
    it('should send bulk email with template', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email_' })
      mockResend.prototype.emails = { send: mockSend }

      const recipients = ['user1@example.com', 'user2@example.com']
      const variables = { name: 'User', discount: '20%' }

      await emailService.sendBulkEmail(
        recipients,
        'Subject',
        '<p>Hello {{name}}, {{discount}} off</p>',
        [{ variables }, { variables }]
      )

      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('should handle failed sends', async () => {
      const mockSend = jest.fn()
        .mockResolvedValueOnce({ id: 'email_1' })
        .mockRejectedValueOnce(new Error('Failed'))
      mockResend.prototype.emails = { send: mockSend }

      const result = await emailService.sendBulkEmail(
        ['user1@example.com', 'user2@example.com'],
        'Subject',
        'Content'
      )

      expect(result.failed).toContain('user2@example.com')
    })
  })
})
```

---

## Setup Recommendations

### Create tests/setup.ts
```typescript
import { configure } from '@testing-library/react'
import '@testing-library/jest-dom'

// Setup test environment
process.env.RESEND_API_KEY = 'test_key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.DATABASE_URL = 'postgresql://test'

// Mock fetch globally if needed
global.fetch = jest.fn()

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Not implemented')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
```

### Package.json test script
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coveragePathIgnorePatterns=node_modules",
    "test:unit": "jest tests/unit",
    "test:unit:watch": "jest tests/unit --watch"
  }
}
```

---

**Copy and customize these templates for each file in the priority list!**
