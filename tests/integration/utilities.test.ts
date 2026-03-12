/**
 * Utility and Validation Helper Tests
 * Tests: Validators, formatters, error handling utilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Validation Utilities', () => {
  describe('Email validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org',
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = ['plaintext', '@example.com', 'user@', 'user @example.com'];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Phone validation', () => {
    const validatePhone = (phone: string): boolean => {
      // Pakistani phone format: +92 or 0, followed by 3-digit area code, then 7 more digits
      const phoneRegex = /^(?:\+92|0)?3\d{9}$/;
      return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    };

    it('should validate Pakistani phone numbers', () => {
      const validPhones = ['+923015555555', '03015555555', '03105555555', '+923105555555'];

      validPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['123', 'abc', '+441234567890', '00923015555555'];

      invalidPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('URL validation', () => {
    const validateURL = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate correct URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://subdomain.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
      ];

      validURLs.forEach((url) => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = ['not a url', 'http://', '  '];

      invalidURLs.forEach((url) => {
        expect(validateURL(url)).toBe(false);
      });
    });
  });

  describe('Currency validation', () => {
    const validateCurrency = (currency: string): boolean => {
      const validCurrencies = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];
      return validCurrencies.includes(currency.toUpperCase());
    };

    it('should validate supported currencies', () => {
      expect(validateCurrency('PKR')).toBe(true);
      expect(validateCurrency('USD')).toBe(true);
      expect(validateCurrency('EUR')).toBe(true);
    });

    it('should reject unsupported currencies', () => {
      expect(validateCurrency('XYZ')).toBe(false);
      expect(validateCurrency('ABC')).toBe(false);
    });
  });
});

describe('String Utilities', () => {
  describe('String formatting', () => {
    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });

    it('should convert to lowercase', () => {
      expect('HELLO'.toLowerCase()).toBe('hello');
    });

    it('should capitalize first letter', () => {
      const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should slug text', () => {
      const slug = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
      expect(slug('Hello World')).toBe('hello-world');
    });
  });

  describe('Text truncation', () => {
    it('should truncate long text', () => {
      const truncate = (text: string, length: number) =>
        text.length > length ? text.substring(0, length) + '...' : text;

      expect(truncate('This is a very long text', 10)).toBe('This is a ...');
    });

    it('should not truncate short text', () => {
      const truncate = (text: string, length: number) =>
        text.length > length ? text.substring(0, length) + '...' : text;

      expect(truncate('Short', 10)).toBe('Short');
    });
  });
});

describe('Date Utilities', () => {
  describe('Date formatting', () => {
    it('should format date as ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(date.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      const daysDiff = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(5);
    });

    it('should check if date is in future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(futureDate.getTime() > Date.now()).toBe(true);
    });

    it('should check if date is in past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(pastDate.getTime() < Date.now()).toBe(true);
    });
  });
});

describe('Number Utilities', () => {
  describe('Currency formatting', () => {
    it('should format number as currency', () => {
      const formatCurrency = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

      const formatted = formatCurrency(1000, 'PKR');
      expect(formatted).toContain('1');
    });

    it('should round to 2 decimal places', () => {
      const round = (num: number, decimals: number) =>
        Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

      expect(round(1.234, 2)).toBe(1.23);
      expect(round(1.235, 2)).toBe(1.24);
    });
  });

  describe('Number validation', () => {
    it('should validate positive numbers', () => {
      const isPositive = (num: number) => typeof num === 'number' && num > 0;

      expect(isPositive(100)).toBe(true);
      expect(isPositive(-10)).toBe(false);
      expect(isPositive(0)).toBe(false);
    });

    it('should validate integer values', () => {
      const isInteger = (num: number) => Number.isInteger(num);

      expect(isInteger(10)).toBe(true);
      expect(isInteger(10.5)).toBe(false);
    });
  });
});

describe('Array Utilities', () => {
  describe('Array operations', () => {
    it('should remove duplicates', () => {
      const removeDuplicates = (arr: any[]) => [...new Set(arr)];

      expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should flatten nested arrays', () => {
      const flatten = (arr: any[]): any[] => arr.flat(Infinity);

      expect(flatten([1, [2, 3], [[4, 5]]])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should find common elements', () => {
      const intersection = (arr1: any[], arr2: any[]) =>
        arr1.filter((item) => arr2.includes(item));

      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it('should chunk array', () => {
      const chunk = (arr: any[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
          arr.slice(i * size, i * size + size)
        );

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});

describe('Object Utilities', () => {
  describe('Object manipulation', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };

      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should pick object properties', () => {
      const pick = (obj: Record<string, any>, keys: string[]) =>
        Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

      const result = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('should omit object properties', () => {
      const omit = (obj: Record<string, any>, keys: string[]) =>
        Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

      const result = omit({ a: 1, b: 2, c: 3 }, ['b']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });
});

describe('Error Handling', () => {
  describe('Error types', () => {
    it('should throw validation errors', () => {
      expect(() => {
        throw new Error('Validation failed');
      }).toThrow('Validation failed');
    });

    it('should handle missing data', () => {
      const getData = (data: any, key: string) => {
        if (!data || !(key in data)) {
          throw new Error(`Missing key: ${key}`);
        }
        return data[key];
      };

      expect(() => getData({}, 'missing')).toThrow('Missing key: missing');
    });

    it('should catch and handle errors gracefully', () => {
      const safeOperation = (fn: () => any) => {
        try {
          return { success: true, data: fn() };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      };

      const result = safeOperation(() => {
        throw new Error('Operation failed');
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation failed');
    });
  });
});
