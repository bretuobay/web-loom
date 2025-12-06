import type { LogLevel, LogEntry, NormalizedError } from '../types/config.types';

export interface StructuredLogEntry extends LogEntry {
  id: string;
  source: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class StructuredLog {
  private static logCounter = 0;

  static createEntry(
    level: LogLevel,
    message: string,
    options: {
      source?: string;
      error?: Error;
      data?: Record<string, unknown>;
      context?: Record<string, unknown>;
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {},
  ): StructuredLogEntry {
    return {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      source: options.source || 'application',
      error: options.error ? this.normalizeError(options.error) : undefined,
      data: options.data,
      context: options.context,
      tags: options.tags,
      metadata: options.metadata,
    };
  }

  static format(entry: StructuredLogEntry, format: 'json' | 'text' | 'simple' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(entry, null, 2);
      case 'text':
        return this.formatAsText(entry);
      case 'simple':
        return this.formatAsSimple(entry);
      default:
        return JSON.stringify(entry);
    }
  }

  private static generateLogId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (++this.logCounter).toString(36);
    return `log_${timestamp}_${counter}`;
  }

  private static normalizeError(error: Error): NormalizedError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  private static formatAsText(entry: StructuredLogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(8);
    const source = entry.source ? `[${entry.source}]` : '';
    const tags = entry.tags?.length ? `{${entry.tags.join(',')}}` : '';

    let formatted = `${timestamp} ${level} ${source}${tags} ${entry.message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      formatted += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return formatted;
  }

  private static formatAsSimple(entry: StructuredLogEntry): string {
    const timestamp = entry.timestamp.toTimeString().slice(0, 8);
    const level = entry.level.toUpperCase();
    const source = entry.source ? `[${entry.source}]` : '';

    return `${timestamp} ${level} ${source} ${entry.message}`;
  }
}
