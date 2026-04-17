import { logger } from '@/lib/utils/logger';

// Mock console methods
let mockConsoleLog: jest.SpyInstance;

describe('Logger Utility', () => {
  beforeEach(() => {
    // Configure logger for testing; force logging even though NODE_ENV is 'test'
    logger.configure({ isDevelopment: true, minLevel: 'debug', forceTestLogging: true });

    // Mock console.log to capture output
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logger.info', () => {
    it('should log info messages in development', () => {
      logger.info('Test info message', { key: 'value' });

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toContain('INFO');
      expect(callArgs).toContain('Test info message');
    });
  });

  describe('logger.error', () => {
    it('should log error messages', () => {
      logger.error('Test error message', new Error('test error'), { error: 'details' });

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toContain('ERROR');
      expect(callArgs).toContain('Test error message');
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message', { context: 'test' });

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toContain('WARN');
      expect(callArgs).toContain('Test warning message');
    });
  });

  describe('logger.debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('Test debug message', { context: 'test' });

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toContain('DEBUG');
      expect(callArgs).toContain('Test debug message');
    });

    it('should not log debug messages in production', () => {
      logger.configure({ isDevelopment: false, minLevel: 'info' });
      logger.debug('Test debug message', { context: 'test' });

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('logger class', () => {
    it('should format timestamps correctly', () => {
      logger.info('Test message');

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle missing context', () => {
      logger.info('Test without context');

      expect(mockConsoleLog).toHaveBeenCalled();
      const callArgs = mockConsoleLog.mock.calls[0][0];
      expect(callArgs).toContain('INFO');
      expect(callArgs).toContain('Test without context');
    });
  });
});
