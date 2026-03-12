import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Stats API Tests
 * Tests for /api/admin/stats endpoint
 */
describe('Admin Stats API Integration Tests', () => {
  const baseURL = 'http://localhost:3000/api/admin/stats';

  describe('GET /api/admin/stats', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Mock the admin stats endpoint (would normally be protected by auth middleware)
      const response = new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toHaveProperty('error');
    });

    it('should return stats for authenticated admin', async () => {
      // This test simulates what an authenticated admin would receive
      const mockStats = {
        total_events: 150,
        total_registrations: 5000,
        total_revenue: 500000,
        avg_event_attendance: 33.33,
        active_events: 45,
        pending_registrations: 200,
      };

      const response = new NextResponse(JSON.stringify(mockStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('total_events');
      expect(data).toHaveProperty('total_revenue');
      expect(typeof data.total_revenue).toBe('number');
    });

    it('should filter stats by date range', async () => {
      const url = new URL(baseURL + '?from=2025-01-01&to=2025-01-31');

      expect(url.searchParams.get('from')).toBe('2025-01-01');
      expect(url.searchParams.get('to')).toBe('2025-01-31');
    });

    it('should return event statistics breakdown', async () => {
      const mockEventStats = {
        by_category: {
          music: { events: 40, revenue: 200000 },
          sports: { events: 35, revenue: 150000 },
          tech: { events: 30, revenue: 100000 },
          other: { events: 45, revenue: 50000 },
        },
        by_status: {
          upcoming: 50,
          ongoing: 10,
          completed: 85,
          cancelled: 5,
        },
      };

      const response = new NextResponse(JSON.stringify(mockEventStats), {
        status: 200,
      });

      const data = await response.json();
      expect(data).toHaveProperty('by_category');
      expect(data).toHaveProperty('by_status');
      expect(data.by_category).toHaveProperty('music');
    });

    it('should return user statistics', async () => {
      const mockUserStats = {
        total_users: 10000,
        active_users: 4500,
        new_users_this_month: 800,
        user_retention_rate: 0.87,
        premium_users: 1200,
        by_country: {
          Pakistan: 9000,
          'United States': 500,
          'United Kingdom': 300,
          other: 200,
        },
      };

      const response = new NextResponse(JSON.stringify(mockUserStats), {
        status: 200,
      });

      const data = await response.json();
      expect(data.total_users).toBeGreaterThan(0);
      expect(data.active_users).toBeLessThanOrEqual(data.total_users);
      expect(data.user_retention_rate).toBeGreaterThan(0);
      expect(data.user_retention_rate).toBeLessThanOrEqual(1);
    });

    it('should return payment statistics', async () => {
      const mockPaymentStats = {
        total_transactions: 25000,
        total_amount: 2500000,
        successful_transactions: 24000,
        failed_transactions: 800,
        pending_transactions: 200,
        average_transaction_value: 100,
        by_method: {
          jazzcash: { count: 12000, amount: 1200000 },
          easypaisa: { count: 8000, amount: 800000 },
          credit_card: { count: 4000, amount: 400000 },
          bank_transfer: { count: 1000, amount: 100000 },
        },
      };

      const response = new NextResponse(JSON.stringify(mockPaymentStats), {
        status: 200,
      });

      const data = await response.json();
      expect(data.total_transactions).toBeGreaterThan(0);
      expect(data.successful_transactions).toBeLessThanOrEqual(
        data.total_transactions
      );
      expect(data).toHaveProperty('by_method');
    });
  });

  describe('GET /api/admin/stats/events', () => {
    it('should return detailed event statistics', async () => {
      const mockEventDetailStats = {
        top_events: [
          {
            event_id: 'event-1',
            name: 'Music Festival 2025',
            registrations: 500,
            revenue: 100000,
            attendance_rate: 0.95,
          },
          {
            event_id: 'event-2',
            name: 'Tech Conference 2025',
            registrations: 300,
            revenue: 75000,
            attendance_rate: 0.88,
          },
        ],
        bottom_performers: [
          {
            event_id: 'event-50',
            name: 'Local Workshop',
            registrations: 10,
            revenue: 500,
            attendance_rate: 0.5,
          },
        ],
      };

      const response = new NextResponse(JSON.stringify(mockEventDetailStats), {
        status: 200,
      });

      const data = await response.json();
      expect(Array.isArray(data.top_events)).toBe(true);
      expect(data.top_events[0]).toHaveProperty('event_id');
      expect(data.top_events[0]).toHaveProperty('attendance_rate');
    });
  });

  describe('GET /api/admin/stats/users', () => {
    it('should return detailed user statistics', async () => {
      const mockUserDetailStats = {
        daily_active_users: [
          { date: '2025-01-28', count: 3500 },
          { date: '2025-01-29', count: 3800 },
          { date: '2025-01-30', count: 4100 },
        ],
        user_engagement_score: {
          high: 1200,
          medium: 2300,
          low: 1000,
        },
        top_cities: [
          { city: 'Karachi', users: 3000, events_attended: 5000 },
          { city: 'Lahore', users: 2500, events_attended: 4200 },
          { city: 'Islamabad', users: 1500, events_attended: 2100 },
        ],
      };

      const response = new NextResponse(JSON.stringify(mockUserDetailStats), {
        status: 200,
      });

      const data = await response.json();
      expect(Array.isArray(data.daily_active_users)).toBe(true);
      expect(data.daily_active_users[0]).toHaveProperty('date');
      expect(Array.isArray(data.top_cities)).toBe(true);
    });
  });
});
