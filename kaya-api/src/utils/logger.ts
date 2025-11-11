/**
 * Structured Logging Utility
 * Replaces console.log with structured, level-based logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private level: LogLevel;
  private enableConsole: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  constructor() {
    // Set log level from environment or default to INFO
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.level = envLevel
      ? (LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO)
      : LogLevel.INFO;

    this.enableConsole = process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatLog(level: string, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output (if enabled)
    if (this.enableConsole) {
      const prefix = `[${entry.timestamp}] [${entry.level}]`;
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? `\nError: ${entry.error.message}${entry.error.stack ? `\n${entry.error.stack}` : ''}` : '';

      const logMethod = entry.level === 'ERROR' ? console.error :
                       entry.level === 'WARN' ? console.warn :
                       entry.level === 'DEBUG' ? console.debug :
                       console.log;

      logMethod(`${prefix} ${entry.message}${contextStr}${errorStr}`);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatLog('DEBUG', message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatLog('INFO', message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatLog('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatLog('ERROR', message, context, error));
    }
  }

  /**
   * Get recent logs (for debugging/monitoring)
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: string): LogEntry[] {
    return this.logBuffer.filter(log => log.level === level);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Singleton logger instance
const logger = new Logger();

export default logger;

