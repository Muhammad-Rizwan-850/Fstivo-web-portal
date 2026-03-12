/**
 * Zod Helpers Tests
 * Tests parsing and validation utilities
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { parseOrThrow, safeParse } from '@/lib/zod-helpers';

describe('Zod Helpers', () => {
  const testSchema = z.object({
    name: z.string().min(2),
    age: z.number().positive(),
    email: z.string().email(),
  });

  describe('safeParse', () => {
    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = safeParse(testSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should return failure for invalid data', () => {
      const invalidData = {
        name: 'J', // Too short
        age: -5, // Negative
        email: 'not-an-email',
      };

      const result = safeParse(testSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should include error details on failure', () => {
      const invalidData = {
        name: 'J',
        age: 30,
        email: 'john@example.com',
      };

      const result = safeParse(testSchema, invalidData);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should handle missing fields', () => {
      const missingData = {
        name: 'John',
        // missing age
        email: 'john@example.com',
      };

      const result = safeParse(testSchema, missingData);
      expect(result.success).toBe(false);
    });

    it('should return parsed data on success', () => {
      const validData = {
        name: 'Jane Doe',
        age: 25,
        email: 'jane@example.com',
      };

      const result = safeParse(testSchema, validData);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('parseOrThrow', () => {
    it('should return parsed data for valid input', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = parseOrThrow(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid data', () => {
      const invalidData = {
        name: 'J',
        age: 30,
        email: 'john@example.com',
      };

      expect(() => {
        parseOrThrow(testSchema, invalidData);
      }).toThrow();
    });

    it('should throw ZodError', () => {
      const invalidData = {
        name: 'J',
        age: -5,
        email: 'invalid',
      };

      try {
        parseOrThrow(testSchema, invalidData);
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.issues).toBeDefined();
      }
    });

    it('should throw when missing required fields', () => {
      const missingData = {
        name: 'John',
        // missing age and email
      };

      expect(() => {
        parseOrThrow(testSchema, missingData as any);
      }).toThrow();
    });

    it('should handle complex nested schemas', () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
        settings: z.object({
          notifications: z.boolean(),
          theme: z.enum(['light', 'dark']),
        }),
      });

      const validData = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        settings: {
          notifications: true,
          theme: 'dark' as const,
        },
      };

      const result = parseOrThrow(complexSchema, validData);
      expect(result.user.name).toBe('John');
      expect(result.settings.theme).toBe('dark');
    });
  });

  describe('Array schema validation', () => {
    const arraySchema = z.array(z.object({
      id: z.number(),
      name: z.string(),
    }));

    it('should validate array of objects', () => {
      const validData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      const result = safeParse(arraySchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid array items', () => {
      const invalidData = [
        { id: 1, name: 'Item 1' },
        { id: 'not-a-number', name: 'Item 2' },
      ];

      const result = safeParse(arraySchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = safeParse(arraySchema, []);
      expect(result.success).toBe(true);
    });
  });

  describe('Type coercion', () => {
    const coercionSchema = z.object({
      count: z.coerce.number(),
      active: z.coerce.boolean(),
    });

    it('should coerce string to number', () => {
      const data = {
        count: '42',
        active: '1',
      };

      const result = safeParse(coercionSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(42);
      }
    });

    it('should coerce to boolean', () => {
      const data = {
        count: 1,
        active: 'true',
      };

      const result = safeParse(coercionSchema, data);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('Optional and nullable fields', () => {
    const optionalSchema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
    });

    it('should accept missing optional field', () => {
      const data = {
        required: 'value',
        // optional is missing
        nullable: 'value',
      };

      const result = safeParse(optionalSchema, data);
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable field', () => {
      const data = {
        required: 'value',
        optional: 'value',
        nullable: null,
      };

      const result = safeParse(optionalSchema, data);
      expect(result.success).toBe(true);
    });

    it('should reject missing required field', () => {
      const data = {
        // required is missing
        optional: 'value',
        nullable: 'value',
      };

      const result = safeParse(optionalSchema, data);
      expect(result.success).toBe(false);
    });
  });

  describe('Custom error messages', () => {
    const customSchema = z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    });

    it('should include custom error message', () => {
      const data = {
        email: 'invalid',
        password: 'short',
      };

      const result = safeParse(customSchema, data);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Enum validation', () => {
    const enumSchema = z.object({
      role: z.enum(['admin', 'user', 'guest']),
      status: z.enum(['active', 'inactive', 'pending']),
    });

    it('should accept valid enum values', () => {
      const data = {
        role: 'admin' as const,
        status: 'active' as const,
      };

      const result = safeParse(enumSchema, data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const data = {
        role: 'superadmin' as any,
        status: 'active' as const,
      };

      const result = safeParse(enumSchema, data);
      expect(result.success).toBe(false);
    });
  });

  describe('Discriminated union', () => {
    const unionSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), value: z.string() }),
      z.object({ type: z.literal('number'), value: z.number() }),
    ]);

    it('should handle discriminated union with text', () => {
      const data = { type: 'text' as const, value: 'hello' };
      const result = safeParse(unionSchema, data);
      expect(result.success).toBe(true);
    });

    it('should handle discriminated union with number', () => {
      const data = { type: 'number' as const, value: 42 };
      const result = safeParse(unionSchema, data);
      expect(result.success).toBe(true);
    });
  });
});
