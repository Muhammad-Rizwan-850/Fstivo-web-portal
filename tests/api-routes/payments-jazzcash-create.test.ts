/**
 * Tests for POST /api/payments/jazzcash/create
 * JazzCash Payment Creation API Route
 *
 * Creates a new JazzCash payment transaction for an order
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/jazzcash/create/route';
import { createClient } from '@supabase/supabase-js';
import { mockSupabaseQuery, resetMockDatabase, mockAuth } from '@/__mocks__/@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => {
    const supabase = createClient('url', 'key');
    return supabase;
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/payments/jazzcash/client', () => ({
  jazzCashClient: {
    createPayment: jest.fn(),
  },
}));

import { jazzCashClient } from '@/lib/payments/jazzcash/client';

describe('POST /api/payments/jazzcash/create', () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.clearAllMocks();
  });

  describe('successful payment creation', () => {
    it('should create payment for valid order', async () => {
      // Setup mocks
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-123',
        user_id: 'user-123',
        payment_status: 'pending',
        amount: 500,
        event: { id: 'event-1', title: 'Awesome Concert', user_id: 'organizer-1' },
        user: { email: 'user@example.com', phone: '03001234567', full_name: 'John Doe' },
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);
      mockSupabaseQuery(supabase, 'payment_intents', [{ id: 'intent-1' }]);

      (jazzCashClient.createPayment as jest.Mock).mockResolvedValue({
        url: 'https://jazzcash.com/pay/xyz123',
        params: { pp_TxnRefNo: 'order-123', pp_Amount: '500' },
      });

      // Build request
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500, description: 'Test payment' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Call handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.payment).toBeDefined();
      expect(data.payment.url).toContain('jazzcash.com');
    });

    it('should use default description when not provided', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-456',
        user_id: 'user-123',
        payment_status: 'pending',
        event: { id: 'event-1', title: 'Music Festival' },
        user: { email: 'user@example.com', phone: '', full_name: 'Jane Doe' },
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);

      (jazzCashClient.createPayment as jest.Mock).mockResolvedValue({
        url: 'https://jazzcash.com/pay/abc456',
        params: {},
      });

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-456', amount: 1000 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify default description includes event title
      expect(jazzCashClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Music Festival'),
        })
      );
    });

    it('should handle payment intent creation errors gracefully', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-789',
        user_id: 'user-123',
        payment_status: 'pending',
        event: { id: 'event-1', title: 'Comedy Show' },
        user: { email: 'user@example.com', phone: '', full_name: 'Bob Smith' },
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);

      // Mock payment intent insert to fail
      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockOrder, error: null }),
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          error: { message: 'Database constraint failed' },
        }),
      } as any);

      (jazzCashClient.createPayment as jest.Mock).mockResolvedValue({
        url: 'https://jazzcash.com/pay/def789',
        params: {},
      });

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-789', amount: 750 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed despite intent creation error
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should return 400 when orderId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid parameters');
    });

    it('should return 400 when amount is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid parameters');
    });

    it('should return 400 when amount is invalid (zero or negative)', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: -100 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid parameters');
    });

    it('should return 401 when user not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 404 when order does not exist', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');
      mockSupabaseQuery(supabase, 'orders', []);

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'nonexistent-order', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Order not found');
    });

    it('should return 404 when order belongs to different user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-999' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-123',
        user_id: 'user-888', // Different user
        payment_status: 'pending',
        event: { id: 'event-1', title: 'Event' },
        user: { email: 'other@example.com', phone: '', full_name: 'Other User' },
      };

      mockSupabaseQuery(supabase, 'orders', []);

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Order not found');
    });

    it('should return 400 when order is already paid', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-123',
        user_id: 'user-123',
        payment_status: 'paid', // Already paid
        event: { id: 'event-1', title: 'Event' },
        user: { email: 'user@example.com', phone: '', full_name: 'User' },
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already paid');
    });

    it('should return 500 when JazzCash client fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-123',
        user_id: 'user-123',
        payment_status: 'pending',
        event: { id: 'event-1', title: 'Event' },
        user: { email: 'user@example.com', phone: '', full_name: 'User' },
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);

      (jazzCashClient.createPayment as jest.Mock).mockRejectedValue(
        new Error('JazzCash API unavailable')
      );

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to create payment');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid parameters');
    });

    it('should use user metadata when order user details missing', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'primary@example.com',
            user_metadata: { full_name: 'Metadata Name', phone: '03009998888' },
          },
        },
        error: null,
      });

      const supabase = createClient('url', 'key');

      const mockOrder = {
        id: 'order-123',
        user_id: 'user-123',
        payment_status: 'pending',
        event: { id: 'event-1', title: 'Event' },
        user: null, // No user details in order
      };

      mockSupabaseQuery(supabase, 'orders', [mockOrder]);

      (jazzCashClient.createPayment as jest.Mock).mockResolvedValue({
        url: 'https://jazzcash.com/pay/test123',
        params: {},
      });

      const request = new NextRequest('http://localhost:3000/api/payments/jazzcash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId: 'order-123', amount: 500 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify it used metadata fallback
      expect(jazzCashClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'primary@example.com',
          customerName: 'Metadata Name',
        })
      );
    });
  });
});
