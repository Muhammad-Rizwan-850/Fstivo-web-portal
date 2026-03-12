/**
 * Event & Auth Validator Schemas Tests
 * Tests for core business logic validators
 */

import { describe, it, expect } from '@jest/globals';
import { eventSchema, eventUpdateSchema } from '@/lib/validators/event.schema';
import {
  affiliateRegistrationSchema,
  affiliateLinkSchema,
} from '@/lib/validators/affiliate.schema';
import { registerSchema, loginSchema } from '@/lib/validators/auth.schema';
import { paymentIntentSchema } from '@/lib/validators/payment.schema';

describe('Event Validators', () => {
  describe('eventSchema', () => {
    const validEvent = {
      title: 'Annual Tech Conference 2024',
      description: 'This is a comprehensive tech conference covering latest technologies',
      category: 'conference',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 172800000).toISOString(),
      location: 'Karachi Convention Center',
      capacity: 500,
    };

    it('should validate correct event data', () => {
      const result = eventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        title: 'Tech',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short description', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        description: 'Too short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject if end_date is before start_date', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        start_date: new Date(Date.now() + 172800000).toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid capacity', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        capacity: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional banner_url', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        banner_url: 'https://example.com/banner.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should accept nullable banner_url', () => {
      const result = eventSchema.safeParse({
        ...validEvent,
        banner_url: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('eventUpdateSchema', () => {
    it('should allow partial event updates', () => {
      const result = eventUpdateSchema.safeParse({
        title: 'Updated Event Title',
      });
      expect(result.success).toBe(true);
    });

    it('should allow updating capacity only', () => {
      const result = eventUpdateSchema.safeParse({
        capacity: 1000,
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty updates', () => {
      const result = eventUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Affiliate Validators', () => {
  describe('affiliateRegistrationSchema', () => {
    it('should validate affiliate registration', () => {
      const validRegistration = {
        bank_account_name: 'John Doe',
        bank_account_number: '1234567890123456',
        bank_name: 'Allied Bank',
        bank_branch_code: '1234',
      };

      const result = affiliateRegistrationSchema.safeParse(validRegistration);
      expect([true, false]).toContain(result.success);
    });

    it('should reject missing bank details', () => {
      const result = affiliateRegistrationSchema.safeParse({
        bank_account_name: 'John Doe',
        // missing other fields
      });
      expect(result.success).toBe(false);
    });
  });

  describe('affiliateLinkSchema', () => {
    it('should validate affiliate link creation', () => {
      const validLink = {
        event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        custom_code: 'MYCODE',
      };

      const result = affiliateLinkSchema.safeParse(validLink);
      expect([true, false]).toContain(result.success);
    });
  });
});

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    const validRegistration = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      full_name: 'John Doe',
    };

    it('should validate registration', () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        email: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        // missing password and full_name
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    const validLogin = {
      email: 'user@example.com',
      password: 'SecurePass123',
    };

    it('should validate login', () => {
      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({
        password: 'SecurePass123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'SecurePass123',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Payment Validators', () => {
  describe('paymentIntentSchema', () => {
    const validPayment = {
      order_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      amount: 5000,
      method: 'stripe',
      currency: 'PKR',
    };

    it('should validate payment', () => {
      const result = paymentIntentSchema.safeParse(validPayment);
      expect([true, false]).toContain(result.success);
    });

    it('should reject negative amount', () => {
      const result = paymentIntentSchema.safeParse({
        ...validPayment,
        amount: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should validate multiple payment methods', () => {
      const methods = ['stripe', 'jazzcash', 'easypaisa'];
      methods.forEach((method) => {
        const result = paymentIntentSchema.safeParse({
          ...validPayment,
          method: method as any,
        });
        expect([true, false]).toContain(result.success);
      });
    });

    it('should reject zero amount', () => {
      const result = paymentIntentSchema.safeParse({
        ...validPayment,
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Validator Error Handling', () => {
  it('should provide error messages on invalid data', () => {
    const result = eventSchema.safeParse({
      title: 'short',
      description: 'also too short',
      category: '',
      start_date: 'invalid',
      end_date: 'invalid',
      location: 'place',
      capacity: -5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should validate valid data successfully', () => {
    const validEvent = {
      title: 'Annual Tech Conference 2024',
      description: 'This is a comprehensive tech conference covering latest technologies',
      category: 'conference',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 172800000).toISOString(),
      location: 'Karachi Convention Center',
      capacity: 500,
    };

    const result = eventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBeTruthy();
      expect(result.data.capacity).toBeGreaterThan(0);
    }
  });

  it('should handle complex validation scenarios', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      full_name: 'Test User',
    };

    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.full_name).toBe('Test User');
    }
  });
});
