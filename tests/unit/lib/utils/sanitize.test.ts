/**
 * Unit tests for sanitize utilities
 * Tests input sanitization and security functions
 */

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

describe('Sanitize Utils', () => {
  describe('sanitizeHtml', () => {
    it('should sanitize HTML and allow safe tags', () => {
      const input = '<p>Hello <strong>world</strong></p><script>alert("xss")</script>';
      const expected = '<p>Hello <strong>world</strong></p>';
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('should remove dangerous tags', () => {
      const input = '<img src="x" onerror="alert(1)"><iframe src="evil.com"></iframe>';
      expect(sanitizeHtml(input)).not.toContain('<img');
      expect(sanitizeHtml(input)).not.toContain('<iframe');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
    });

    it('should allow safe attributes', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      expect(sanitizeHtml(input)).toContain('href="https://example.com"');
      expect(sanitizeHtml(input)).toContain('target="_blank"');
      expect(sanitizeHtml(input)).toContain('rel="noopener"');
    });

    it('should remove dangerous attributes', () => {
      const input = '<a href="javascript:alert(1)" onclick="evil()">Link</a>';
      expect(sanitizeHtml(input)).not.toContain('javascript:');
      expect(sanitizeHtml(input)).not.toContain('onclick');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p><script>alert("xss")</script>';
      expect(sanitizeText(input)).toBe('Hello world');
    });

    it('should handle non-string input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
      expect(sanitizeText(123 as any)).toBe('');
    });

    it('should preserve text content', () => {
      expect(sanitizeText('Normal text')).toBe('Normal text');
      expect(sanitizeText('Text with &amp; entities')).toBe('Text with &amp; entities');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP/HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    it('should reject dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe('');
      expect(sanitizeUrl('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeUrl(null as any)).toBe('');
      expect(sanitizeUrl(undefined as any)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('User.Name+Tag@Domain.Co.Uk')).toBe('user.name+tag@domain.co.uk');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should remove non-digit characters except +', () => {
      expect(sanitizePhone('+92-300-123-4567')).toBe('+923001234567');
      expect(sanitizePhone('(0300) 123-4567')).toBe('03001234567');
      expect(sanitizePhone('300 123 4567 ext. 123')).toBe('3001234567123');
    });

    it('should handle non-string input', () => {
      expect(sanitizePhone(null as any)).toBe('');
      expect(sanitizePhone(undefined as any)).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('This is a very long text that should be truncated', 20))
        .toBe('This is a very lo...');
      expect(truncateText('Short text', 50)).toBe('Short text');
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('abc', 3)).toBe('abc');
      expect(truncateText('abcd', 3)).toBe('...');
    });

    it('should handle non-string input', () => {
      expect(truncateText(null as any, 10)).toBe('');
      expect(truncateText(undefined as any, 10)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
      expect(sanitizeFilename('normal-file.txt')).toBe('normal-file.txt');
    });

    it('should handle non-string input', () => {
      expect(sanitizeFilename(null as any)).toBe('');
      expect(sanitizeFilename(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
    });
  });

  describe('escapeSql', () => {
    it('should escape SQL special characters', () => {
      expect(escapeSql("Don't")).toBe("Don\\'t");
      expect(escapeSql('Say "Hello"')).toBe('Say \\"Hello\\"');
      expect(escapeSql('Path\\to\\file')).toBe('Path\\\\to\\\\file');
      expect(escapeSql('Value%')).toBe('Value\\%');
    });

    it('should escape control characters', () => {
      expect(escapeSql('Line\nBreak')).toBe('Line\\nBreak');
      expect(escapeSql('Tab\tChar')).toBe('Tab\\tChar');
      expect(escapeSql('Null\0Char')).toBe('Null\\0Char');
    });

    it('should handle non-string input', () => {
      expect(escapeSql(null as any)).toBe('');
      expect(escapeSql(undefined as any)).toBe('');
    });
  });
});