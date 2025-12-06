import type { Transport } from '../logger/Transport';
import type { LogEntry, LogLevel } from '../types/config.types';
import { shouldLog } from '../logger/LogLevel';

export class MemoryTransport implements Transport {
  readonly name = 'memory';
  private logs: LogEntry[] = [];
  private level: LogLevel = 'debug';
  private maxSize: number = 1000;

  constructor(config: { level?: LogLevel; maxSize?: number } = {}) {
    this.level = config.level || 'debug';
    this.maxSize = config.maxSize || 1000;
  }

  log(entry: LogEntry): void {
    // Deep clone the entry to prevent mutation
    const clonedEntry: LogEntry = {
      ...entry,
      data: entry.data ? { ...entry.data } : undefined,
      context: entry.context ? { ...entry.context } : undefined,
      error: entry.error ? { ...entry.error } : undefined,
    };

    this.logs.push(clonedEntry);

    // Remove oldest logs if exceeding max size
    if (this.logs.length > this.maxSize) {
      const excess = this.logs.length - this.maxSize;
      this.logs.splice(0, excess);
    }
  }

  configure(config: { level?: LogLevel; maxSize?: number }): void {
    if (config.level) {
      this.level = config.level;
    }
    if (config.maxSize !== undefined) {
      this.maxSize = config.maxSize;
      // Trim existing logs if new size is smaller
      if (this.logs.length > this.maxSize) {
        this.logs = this.logs.slice(-this.maxSize);
      }
    }
  }

  isLevelEnabled(level: LogLevel): boolean {
    return shouldLog(this.level, level);
  }

  // Memory transport specific methods
  getLogs(): LogEntry[] {
    return [...this.logs]; // Return a copy
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getLogsAfter(timestamp: Date): LogEntry[] {
    return this.logs.filter((log) => log.timestamp > timestamp);
  }

  getLogsBefore(timestamp: Date): LogEntry[] {
    return this.logs.filter((log) => log.timestamp < timestamp);
  }

  getLogsBetween(start: Date, end: Date): LogEntry[] {
    return this.logs.filter((log) => log.timestamp >= start && log.timestamp <= end);
  }

  searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerQuery) ||
        (log.error?.message && log.error.message.toLowerCase().includes(lowerQuery)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerQuery)),
    );
  }

  clear(): void {
    this.logs = [];
  }

  getSize(): number {
    return this.logs.length;
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  getOldestLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[0] : undefined;
  }

  getLatestLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
  }

  // Export logs for external processing
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportAsCSV();
    }
    return JSON.stringify(this.logs, null, 2);
  }

  private exportAsCSV(): string {
    if (this.logs.length === 0) {
      return '';
    }

    const headers = ['timestamp', 'level', 'message', 'error', 'data'];
    const rows = this.logs.map((log) => [
      log.timestamp.toISOString(),
      log.level,
      log.message,
      log.error ? `${log.error.name}: ${log.error.message}` : '',
      log.data ? JSON.stringify(log.data) : '',
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }
}
