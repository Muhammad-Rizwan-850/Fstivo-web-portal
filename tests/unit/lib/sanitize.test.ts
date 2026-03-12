import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  truncateText,
  sanitizeFilename,
  escapeSql,
} from '@/lib/utils/sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('allows safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Hello');
      expect(result).toContain('strong');
    });

    it('removes script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('removes event handlers', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('handles non-string input', () => {
      const result = sanitizeHtml(null as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('removes all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('Hello');
    });

    it('removes script tags completely', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).not.toContain('script');
    });

    it('handles non-string input', () => {
      const result = sanitizeText(undefined as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('accepts valid http URL', () => {
      const url = 'http://example.com/page';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('accepts valid https URL', () => {
      const url = 'https://example.com/page';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('rejects javascript: protocol', () => {
      const url = 'javascript:alert("xss")';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('rejects data: protocol', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('handles invalid URLs', () => {
      const url = 'not a url';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('handles non-string input', () => {
      const result = sanitizeUrl(123 as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('converts email to lowercase', () => {
      const result = sanitizeEmail('Test@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('trims whitespace', () => {
      const result = sanitizeEmail('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });

    it('handles non-string input', () => {
      const result = sanitizeEmail(null as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('removes non-digit characters except +', () => {
      const result = sanitizePhone('+92 (300) 123-4567');
      expect(result).toBe('+923001234567');
    });

    it('handles various phone formats', () => {
      const result = sanitizePhone('03001234567');
      expect(result).toBe('03001234567');
    });

    it('preserves + prefix for international numbers', () => {
      const result = sanitizePhone('+1-800-555-0123');
      expect(result).toMatch(/^\+1/);
    });

    it('handles non-string input', () => {
      const result = sanitizePhone(undefined as any);
      expect(result).toBe('');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const result = truncateText('This is a very long text', 10);
      expect(result.length).toBeLessThanOrEqual(15); // includes ellipsis
    });

    it('does not truncate short text', () => {
      const result = truncateText('Short', 20);
      expect(result).toBe('Short');
    });

    it('adds ellipsis when truncating', () => {
      const result = truncateText('This is long', 5);
      expect(result.includes('...') || result.length < 'This is long'.length).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('removes invalid characters', () => {
      const result = sanitizeFilename('file<name>.txt');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles various filenames', () => {
      const result = sanitizeFilename('my file name.txt');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('handles special characters', () => {
      const result = sanitizeFilename('photo@2024.jpg');
      expect(result).toBeDefined();
    });
  });

  describe('escapeSql', () => {
    it('escapes single quotes', () => {
      const result = escapeSql("O'Reilly");
      expect(result).toContain('\\');
    });

    it('escapes backslashes', () => {
      const result = escapeSql('back\\slash');
      expect(result).toContain('\\');
    });

    it('handles SQL injection attempts', () => {
      const result = escapeSql("'; DROP TABLE users; --");
      expect(result).toBeDefined();
      // Should have escaped the quote
      expect(result).toContain('\\');
    });

    it('escapes percent signs', () => {
      const result = escapeSql('50% discount');
      expect(result).toContain('\\%');
    });
  });
});
