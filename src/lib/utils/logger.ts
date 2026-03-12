const IS_TEST = process.env.NODE_ENV === 'test';
/**
 * Enhanced production-ready logger
 * Supports multiple transports and log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  // Allow reconfiguration for testing
  configure(options: { isDevelopment?: boolean; minLevel?: LogLevel }) {
    if (options.isDevelopment !== undefined) {
      this.isDevelopment = options.isDevelopment;
    }
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;

    if (this.isDevelopment) {
      const color = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        fatal: '\x1b[35m',
      }[level];

      const reset = '\x1b[0m';
      let output = color + '[' + level.toUpperCase() + ']' + reset + ' ' + timestamp + ' - ' + message;

      if (context) {
        output += '\n  Context: ' + JSON.stringify(context, null, 2);
      }

      if (error) {
        output += '\n  Error: ' + error.message + '\n  Stack: ' + error.stack;
      }

      return output;
    } else {
      return JSON.stringify({
        ...entry,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      });
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.formatMessage(entry);

    if (this.isDevelopment) {
      try {
        if (!IS_TEST) console.log(formatted);
      } catch (e) {
        // fallback: nothing else to do
      }
    } else {
      this.sendToLogAggregator(entry);
    }

    if (level === 'error' || level === 'fatal') {
      this.logToDatabase(entry);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, context, errorObj);
  }

  fatal(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log('fatal', message, context, errorObj);
  }

  private async sendToLogAggregator(entry: LogEntry) {
    if (process.env.SENTRY_DSN && (entry.level === 'error' || entry.level === 'fatal')) {
    }

    if (process.env.NEXT_PUBLIC_MONITORING_URL) {
      try {
        await fetch(process.env.NEXT_PUBLIC_MONITORING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch (error) {
      }
    }
  }

  private async logToDatabase(entry: LogEntry) {
    try {
      if (typeof window === 'undefined') {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = createClient();

        await supabase.from('error_logs').insert({
          level: entry.level,
          message: entry.message,
          context: entry.context,
          error_message: entry.error?.message,
          error_stack: entry.error?.stack,
          timestamp: entry.timestamp,
        });
      }
    } catch (error) {
    }
  }
}

export const logger = new Logger();
