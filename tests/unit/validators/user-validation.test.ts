/**
 * Library Functions Tests
 * Tests actual imported functions from src/lib
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  userValidationSchema,
} from '@/lib/validators/userValidator';

describe('User Validators', () => {
  describe('userRegistrationSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        full_name: 'John Doe',
      };

      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        full_name: 'John Doe',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'weakpass', // No uppercase, number, or special char
        full_name: 'John Doe',
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate optional phone field', () => {
      const dataWithPhone = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        full_name: 'John Doe',
        phone: '+923015555555',
      };

      const result = userRegistrationSchema.safeParse(dataWithPhone);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        full_name: 'John Doe',
        phone: '123456789', // Invalid format
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short full name', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        full_name: 'J', // Too short
      };

      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userLoginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'MyPassword123',
      };

      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const invalidData = {
        email: '',
        password: 'MyPassword123',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };

      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userProfileUpdateSchema', () => {
    it('should allow partial profile updates', () => {
      const updateData = {
        full_name: 'Jane Doe',
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should accept valid phone in profile update', () => {
      const updateData = {
        phone: '+923105555555',
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL in avatar_url', () => {
      const updateData = {
        avatar_url: 'not-a-url',
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it('should accept valid URL in avatar_url', () => {
      const updateData = {
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should reject bio longer than 500 characters', () => {
      const updateData = {
        bio: 'a'.repeat(501),
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });

    it('should accept bio of 500 characters or less', () => {
      const updateData = {
        bio: 'a'.repeat(500),
      };

      const result = userProfileUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('userValidationSchema', () => {
    it('should validate complete user data', () => {
      const validData = {
        email: 'user@example.com',
        full_name: 'John Doe',
        role: 'attendee',
      };

      const result = userValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with all user roles', () => {
      const roles = ['attendee', 'organizer', 'admin'];

      roles.forEach((role) => {
        const data = {
          email: 'user@example.com',
          full_name: 'John Doe',
          role: role as any,
        };

        const result = userValidationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'user@example.com',
        full_name: 'John Doe',
        role: 'invalid-role' as any,
      };

      const result = userValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'user@example.com',
        // missing full_name
        role: 'attendee',
      };

      const result = userValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Data Transformation', () => {
  it('should parse valid registration data', () => {
    const input = {
      email: 'newuser@example.com',
      password: 'ValidPass123!',
      full_name: 'Jane Smith',
    };

    const result = userRegistrationSchema.safeParse(input);
    if (result.success) {
      expect(result.data.email).toBe('newuser@example.com');
      expect(result.data.full_name).toBe('Jane Smith');
    }
  });

  it('should return error details on validation failure', () => {
    const invalidData = {
      email: 'invalid',
      password: 'weak',
      full_name: 'J',
    };

    const result = userRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('Batch Operations', () => {
  it('should validate multiple registrations', () => {
    const registrations = [
      {
        email: 'user1@example.com',
        password: 'SecurePass123!',
        full_name: 'User One',
      },
      {
        email: 'user2@example.com',
        password: 'SecurePass456!',
        full_name: 'User Two',
      },
    ];

    registrations.forEach((reg) => {
      const result = userRegistrationSchema.safeParse(reg);
      expect(result.success).toBe(true);
    });
  });

  it('should identify all validation errors', () => {
    const invalidData = {
      email: 'bad-email', // Invalid
      password: 'weak', // Invalid
      full_name: '', // Invalid
    };

    const result = userRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
