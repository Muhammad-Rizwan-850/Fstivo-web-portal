import {
  cn,
  formatCurrency,
  formatDate,
  generateSlug,
  truncate,
  getInitials,
  isValidEmail,
  isValidPhone,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4'); // tailwind-merge may reorder
      expect(cn('', 'px-2')).toBe('px-2');
      expect(cn('px-2', '')).toBe('px-2');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('1,000');
      expect(formatted).toContain('Rs'); // Pakistani Rupee symbol
      expect(formatCurrency(1000, 'USD')).toMatch(/\$1,000/);
      expect(formatCurrency(1234567, 'PKR')).toMatch(/1,234,567/);
      expect(formatCurrency(0)).toMatch(/0/);
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2024-01-01');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    it('should format date in long format', () => {
      const date = new Date('2024-01-01T10:30:00');
      const formatted = formatDate(date, 'long');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('10:30');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-01');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Test Event 2024!')).toBe('test-event-2024');
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
      expect(generateSlug('Special@#$%Characters')).toBe('specialcharacters');
      expect(generateSlug('')).toBe('');
      expect(generateSlug('---')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const long = 'a'.repeat(200);
      expect(truncate(long, 100)).toHaveLength(103); // 100 + '...'
      expect(truncate(long, 100)).toBe('a'.repeat(100) + '...');
    });

    it('should not truncate short text', () => {
      expect(truncate('short', 100)).toBe('short');
      expect(truncate('exactly 10 chars', 17)).toBe('exactly 10 chars');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 100)).toBe('');
      expect(truncate('a', 1)).toBe('a');
      expect(truncate('ab', 1)).toBe('a...');
    });
  });

  describe('getInitials', () => {
    it('should get initials correctly', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('John')).toBe('JO');
      expect(getInitials('A')).toBe('AA');
      expect(getInitials('Mary Jane Smith')).toBe('MJ'); // Takes first two words
      expect(getInitials('  John   Doe  ')).toBe('JD');
    });

    it('should handle edge cases', () => {
      expect(getInitials('')).toBe('');
      expect(getInitials('   ')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate Pakistani phone numbers', () => {
      expect(isValidPhone('+923001234567')).toBe(true);
      expect(isValidPhone('03001234567')).toBe(true);
      expect(isValidPhone('3001234567')).toBe(true);
      expect(isValidPhone('+923451234567')).toBe(true);
      expect(isValidPhone('03451234567')).toBe(true);
      expect(isValidPhone('invalid')).toBe(false);
      expect(isValidPhone('1234567890')).toBe(false);
      expect(isValidPhone('+1234567890')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });
});
