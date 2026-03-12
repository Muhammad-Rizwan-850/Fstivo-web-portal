/**
 * Example Unit Test
 * Demonstrates testing patterns and utilities
 */

import { logger } from '@/lib/utils/logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('Logger Utility', () => {
  let consoleOutput: string[] = [];
  const originalConsole = { ...console };

  beforeEach(() => {
    consoleOutput = [];
    // Configure logger for testing
    logger.configure({ isDevelopment: true, minLevel: 'debug' });

    // Mock console.log to capture output
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
      originalConsole.log(...args);
    });
  });

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsole.log;
    jest.restoreAllMocks();
  });

  describe('logger.info', () => {
    it('should log info messages in development', () => {
      const initialLength = consoleOutput.length;
      logger.info('Test info message', { key: 'value' });

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toContain('INFO');
      expect(lastOutput).toContain('Test info message');
    });
  });

  describe('logger.error', () => {
    it('should log error messages', () => {
      const initialLength = consoleOutput.length;
      logger.error('Test error message', new Error('test error'), { error: 'details' });

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toContain('ERROR');
      expect(lastOutput).toContain('Test error message');
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', () => {
      const initialLength = consoleOutput.length;
      logger.warn('Test warning message', { context: 'test' });

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toContain('WARN');
      expect(lastOutput).toContain('Test warning message');
    });
  });

  describe('logger.debug', () => {
    it('should log debug messages in development', () => {
      const initialLength = consoleOutput.length;
      logger.debug('Test debug message', { context: 'test' });

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toContain('DEBUG');
      expect(lastOutput).toContain('Test debug message');
    });

    it('should not log debug messages in production', () => {
      logger.configure({ isDevelopment: false, minLevel: 'info' });
      const initialLength = consoleOutput.length;
      logger.debug('Test debug message', { context: 'test' });

      expect(consoleOutput.length).toBe(initialLength);
    });
  });

  describe('logger class', () => {
    it('should format timestamps correctly', () => {
      const initialLength = consoleOutput.length;
      logger.info('Test message');

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle missing context', () => {
      const initialLength = consoleOutput.length;
      logger.info('Test without context');

      expect(consoleOutput.length).toBeGreaterThan(initialLength);
      const lastOutput = consoleOutput[consoleOutput.length - 1];
      expect(lastOutput).toContain('INFO');
      expect(lastOutput).toContain('Test without context');
    });
  });
});
