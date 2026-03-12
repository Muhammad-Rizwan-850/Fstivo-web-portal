/**
 * Unit tests for upload utilities
 * Tests file validation, formatting, and utility functions
 */

import {
  validateFile,
  formatFileSize,
  getFileExtension,
  generateUniqueFilename,
  getImageDimensions,
} from '@/lib/utils/uploadUtils';

// Mock File constructor
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(parts: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = options.size || 0;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

describe('Upload Utils', () => {
  describe('validateFile', () => {
    it('should validate file size', () => {
      const smallFile = new File([''], 'test.txt', { size: 1000 });
      const largeFile = new File([''], 'test.txt', { size: 10 * 1024 * 1024 }); // 10MB

      expect(validateFile(smallFile, { maxSize: 2000 }).valid).toBe(true);
      expect(validateFile(largeFile, { maxSize: 1024 * 1024 }).valid).toBe(false);
      expect(validateFile(largeFile, { maxSize: 1024 * 1024 }).error).toContain('File size');
    });

    it('should validate file type', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(validateFile(imageFile, { allowedTypes: 'image/*' }).valid).toBe(true);
      expect(validateFile(textFile, { allowedTypes: 'image/*' }).valid).toBe(false);
      expect(validateFile(textFile, { allowedTypes: 'image/*' }).error).toContain('File type');
    });

    it('should validate multiple types', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(validateFile(imageFile, { allowedTypes: 'image/*,application/pdf' }).valid).toBe(true);
      expect(validateFile(pdfFile, { allowedTypes: 'image/*,application/pdf' }).valid).toBe(true);
    });

    it('should pass validation with no options', () => {
      const file = new File([''], 'test.txt', { size: 1000, type: 'text/plain' });
      expect(validateFile(file).valid).toBe(true);
    });

    it('should handle invalid input', () => {
      // The function doesn't check for null input, so it should throw
      expect(() => validateFile(null as any)).toThrow();
      expect(() => validateFile(undefined as any)).toThrow();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should handle very large numbers', () => {
      // For numbers larger than TB, it will show as TB with large multiplier
      const result = formatFileSize(1024 * 1024 * 1024 * 1024 * 1024);
      expect(result).toContain('TB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('file.tar.gz')).toBe('gz');
      expect(getFileExtension('no-extension')).toBe('');
      expect(getFileExtension('.hidden')).toBe(''); // Hidden files starting with . have no extension
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('file.name.txt')).toBe('txt');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filenames', () => {
      const filename1 = generateUniqueFilename('test.jpg');
      const filename2 = generateUniqueFilename('test.jpg');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/\d+-[a-z0-9]+\.jpg$/);
      expect(filename2).toMatch(/\d+-[a-z0-9]+\.jpg$/);
    });

    it('should include user ID when provided', () => {
      const filename = generateUniqueFilename('test.jpg', 'user123');
      expect(filename).toMatch(/^user123\/\d+-[a-z0-9]+\.jpg$/);
    });

    it('should handle files without extensions', () => {
      const filename = generateUniqueFilename('test');
      expect(filename).toMatch(/\d+-[a-z0-9]+$/); // No dot when no extension
    });

    it('should handle edge cases', () => {
      expect(generateUniqueFilename('')).toMatch(/\d+-[a-z0-9]+$/);
      expect(generateUniqueFilename('file')).toMatch(/\d+-[a-z0-9]+$/);
      expect(generateUniqueFilename('.hidden')).toMatch(/\d+-[a-z0-9]+$/);
    });
  });

  describe('getImageDimensions', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();

    beforeEach(() => {
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      global.Image = jest.fn(() => ({
        onload: null,
        onerror: null,
        src: '',
        width: 0,
        height: 0,
      })) as any;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should resolve image dimensions', async () => {
      const mockImage = global.Image as jest.MockedFunction<any>;
      const imageInstance = { width: 800, height: 600, onload: null, onerror: null, src: '' };
      mockImage.mockReturnValue(imageInstance);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const promise = getImageDimensions(file);

      // Trigger onload
      imageInstance.onload?.(null as any);

      const dimensions = await promise;

      expect(dimensions).toEqual({ width: 800, height: 600 });
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should reject on image load error', async () => {
      const mockImage = global.Image as jest.MockedFunction<any>;
      const imageInstance = { width: 0, height: 0, onload: null, onerror: null, src: '' };
      mockImage.mockReturnValue(imageInstance);

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const promise = getImageDimensions(file);

      // Trigger onerror
      imageInstance.onerror?.(new Error('Load failed'));

      await expect(promise).rejects.toThrow('Failed to load image');
    });

    it('should handle non-image files', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });

      await expect(getImageDimensions(file)).rejects.toThrow('File is not an image');
    });
  });
});