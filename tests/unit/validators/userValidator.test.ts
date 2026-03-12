import { describe, test, expect } from '@jest/globals';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfileUpdate,
  userValidationSchema,
  userUpdateSchema
} from '@/lib/validators/userValidator';

describe('User Validator', () => {
  describe('validateUserRegistration', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'John Doe',
        phone: '+923001234567',
      };

      const result = validateUserRegistration(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        full_name: 'John Doe',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        full_name: 'John Doe',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123!',
        full_name: 'John Doe',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password!',
        full_name: 'John Doe',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject password without special character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'John Doe',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject name less than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'J',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
    });

    test('should accept valid Pakistani phone number', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'John Doe',
        phone: '03001234567',
      };

      const result = validateUserRegistration(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid Pakistani phone number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'John Doe',
        phone: '12345',
      };

      const result = validateUserRegistration(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateUserLogin', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateUserLogin(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = validateUserLogin(invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = validateUserLogin(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateUserProfileUpdate', () => {
    test('should validate correct profile update data', () => {
      const validData = {
        full_name: 'Jane Doe',
        bio: 'Software developer',
      };

      const result = validateUserProfileUpdate(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    test('should allow empty update data', () => {
      const result = validateUserProfileUpdate({});
      expect(result.success).toBe(true);
    });

    test('should reject bio over 500 characters', () => {
      const invalidData = {
        bio: 'a'.repeat(501),
      };

      const result = validateUserProfileUpdate(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid avatar URL', () => {
      const invalidData = {
        avatar_url: 'not-a-url',
      };

      const result = validateUserProfileUpdate(invalidData);
      expect(result.success).toBe(false);
    });

    test('should accept valid avatar URL', () => {
      const validData = {
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const result = validateUserProfileUpdate(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid university ID', () => {
      const invalidData = {
        university_id: 'not-a-uuid',
      };

      const result = validateUserProfileUpdate(invalidData);
      expect(result.success).toBe(false);
    });

    test('should accept valid university ID', () => {
      const validData = {
        university_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = validateUserProfileUpdate(validData);
      expect(result.success).toBe(true);
    });
  });
});
