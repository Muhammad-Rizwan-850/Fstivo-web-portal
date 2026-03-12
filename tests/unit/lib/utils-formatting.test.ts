import {
  formatCurrency,
  formatDate,
  generateSlug,
  truncate,
  getInitials,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats currency with default PKR', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1,000');
    });

    it('formats currency with specific currency code', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('1,000');
    });

    it('handles zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toBeDefined();
      expect(result).toContain('0');
    });

    it('handles large amounts', () => {
      const result = formatCurrency(1000000);
      expect(result).toBeDefined();
      expect(result).toContain('1,000,000');
    });
  });

  describe('formatDate', () => {
    it('formats date in short format', () => {
      const result = formatDate('2025-01-30', 'short');
      expect(result).toMatch(/Jan|January/);
      expect(result).toContain('30');
    });

    it('formats date in long format', () => {
      const result = formatDate('2025-01-30', 'long');
      expect(result).toMatch(/January/);
      expect(result).toContain('30');
      expect(result).toMatch(/\d{2}:\d{2}/); // time portion
    });

    it('defaults to short format if not specified', () => {
      const result = formatDate('2025-01-30');
      expect(result).toMatch(/Jan|January/);
    });

    it('handles Date objects', () => {
      const date = new Date('2025-01-30');
      const result = formatDate(date, 'short');
      expect(result).toBeDefined();
    });
  });

  describe('generateSlug', () => {
    it('converts text to lowercase slug', () => {
      const result = generateSlug('Hello World Event');
      expect(result).toBe('hello-world-event');
    });

    it('removes special characters', () => {
      const result = generateSlug('Test Event @#$% 2025');
      expect(result).toBe('test-event-2025');
    });

    it('handles multiple spaces and dashes', () => {
      const result = generateSlug('Test   Event---Name');
      expect(result).toBe('test-event-name');
    });

    it('removes leading and trailing dashes', () => {
      const result = generateSlug('---test event---');
      expect(result).toBe('test-event');
    });

    it('handles empty input', () => {
      const result = generateSlug('');
      expect(result).toBe('');
    });

    it('handles underscores', () => {
      const result = generateSlug('test_event_name');
      expect(result).toBe('test-event-name');
    });
  });

  describe('truncate', () => {
    it('returns full text if under length limit', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      expect(result).toBe(text);
    });

    it('truncates text and adds ellipsis', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncate(text, 10);
      expect(result).toHaveLength(13); // 10 chars + '...'
      expect(result).toMatch(/\.\.\.$/);
    });

    it('defaults to 100 character length', () => {
      const text = 'a'.repeat(150);
      const result = truncate(text);
      // Default length is 100, plus '...' = up to 103 chars
      // But the function strips trailing whitespace from the truncated part
      expect(result.length).toBeGreaterThan(100);
      expect(result).toMatch(/\.\.\.$/);
    });

    it('trims trailing whitespace', () => {
      const text = 'This is text  ';
      const result = truncate(text, 10);
      expect(result).not.toMatch(/\s+\.\.\.$/);
    });

    it('handles empty string', () => {
      const result = truncate('', 100);
      expect(result).toBe('');
    });
  });

  describe('getInitials', () => {
    it('returns initials from single name', () => {
      const result = getInitials('Ahmed');
      expect(result).toMatch(/^[A]/);
    });

    it('returns initials from full name', () => {
      const result = getInitials('Ahmed Hassan');
      expect(result).toBe('AH');
    });

    it('handles multiple names', () => {
      const result = getInitials('Ahmed Hassan Khan');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('trims whitespace', () => {
      const result = getInitials('  John Doe  ');
      expect(result).toBe('JD');
    });

    it('handles empty string', () => {
      const result = getInitials('');
      expect(result).toBe('');
    });

    it('handles only spaces', () => {
      const result = getInitials('   ');
      expect(result).toBe('');
    });

    it('limits initials to 2 characters', () => {
      const result = getInitials('John David Smith');
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });
});
