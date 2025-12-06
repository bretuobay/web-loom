import type { Logger } from './Logger';
import type { Transport } from './Transport';
import type { LoggerConfig, LogLevel } from '../types/config.types';
import { shouldLog } from './LogLevel';
import { StructuredLog } from './StructuredLog';
import { BaseError } from '../errors/BaseError';

export class StructuredLogger implements Logger {
  private transports: Transport[];
  private context: Record<string, unknown> = {};
  private prefix?: string;
  private level: LogLevel;
  private source: string;

  constructor(
    private config: LoggerConfig = {},
    transports?: Transport[],
  ) {
    this.transports = transports || [];
    this.level = config.level || 'info';
    this.source = 'application';

    if (config.context) {
      this.context = { ...config.context };
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, undefined, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, undefined, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, undefined, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, error, data);
  }

  critical(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('critical', message, error, data);
  }

  withContext(context: Record<string, unknown>): Logger {
    const newLogger = new StructuredLogger(this.config, this.transports);
    newLogger.context = { ...this.context, ...context };
    newLogger.prefix = this.prefix;
    newLogger.level = this.level;
    newLogger.source = this.source;
    return newLogger;
  }

  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  createChild(prefix: string): Logger {
    const child = new StructuredLogger(this.config, this.transports);
    child.context = { ...this.context };
    child.prefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    child.level = this.level;
    child.source = this.source;
    return child;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return shouldLog(this.level, level);
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(transportName: string): boolean {
    const initialLength = this.transports.length;
    this.transports = this.transports.filter((t) => t.name !== transportName);
    return this.transports.length < initialLength;
  }

  async flush(): Promise<void> {
    const flushPromises = this.transports.filter((t) => t.flush).map((t) => t.flush!());

    await Promise.allSettled(flushPromises);
  }

  async destroy(): Promise<void> {
    await this.flush();

    const destroyPromises = this.transports.filter((t) => t.destroy).map((t) => t.destroy!());

    await Promise.allSettled(destroyPromises);
    this.transports = [];
  }

  private log(level: LogLevel, message: string, error?: Error, data?: Record<string, unknown>): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const formattedMessage = this.prefix ? `[${this.prefix}] ${message}` : message;

    const entry = StructuredLog.createEntry(level, formattedMessage, {
      source: this.source,
      error,
      data: { ...this.context, ...data },
      context: this.context,
    });

    // Send to all enabled transports
    this.transports.forEach((transport) => {
      try {
        // Check if transport has level filtering
        if (transport.isLevelEnabled && !transport.isLevelEnabled(level)) {
          return;
        }

        const result = transport.log(entry);

        // Handle async transports
        if (result && typeof result.catch === 'function') {
          (result as Promise<void>).catch((transportError) => {
            console.error(`Transport '${transport.name}' error:`, transportError);
          });
        }
      } catch (transportError) {
        console.error(`Transport '${transport.name}' error:`, transportError);
      }
    });
  }

  private normalizeError(error: Error): Record<string, unknown> {
    const normalized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    // Add additional properties for BaseError instances
    if (error instanceof BaseError) {
      Object.assign(normalized, {
        code: error.code,
        category: error.category,
        severity: error.severity,
        recoverable: error.recoverable,
        retryable: error.retryable,
        userFacing: error.userFacing,
        timestamp: error.timestamp,
        context: error.context,
        breadcrumbs: error.breadcrumbs,
      });
    }

    return normalized;
  }
}
