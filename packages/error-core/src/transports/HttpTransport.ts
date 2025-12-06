import type { Transport } from '../logger/Transport';
import type { LogEntry, LogLevel, HttpTransportConfig } from '../types/config.types';
import { shouldLog } from '../logger/LogLevel';

export class HttpTransport implements Transport {
  readonly name = 'http';

  private endpoint: string;
  private level: LogLevel = 'error';
  private batchSize: number = 10;
  private batchTimeout: number = 5000;
  private headers: Record<string, string> = {};
  private method: string = 'POST';
  private timeout: number = 10000;

  private queue: LogEntry[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private isDestroyed = false;

  constructor(config: HttpTransportConfig) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize || this.batchSize;
    this.batchTimeout = config.batchTimeout || this.batchTimeout;
    this.method = config.method || this.method;
    this.timeout = config.timeout || this.timeout;

    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  log(entry: LogEntry): void {
    if (this.isDestroyed) {
      return;
    }

    this.queue.push(entry);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  configure(config: Partial<HttpTransportConfig>): void {
    if (config.endpoint) {
      this.endpoint = config.endpoint;
    }
    if (config.batchSize !== undefined) {
      this.batchSize = config.batchSize;
    }
    if (config.batchTimeout !== undefined) {
      this.batchTimeout = config.batchTimeout;
    }
    if (config.headers) {
      this.headers = { ...this.headers, ...config.headers };
    }
    if (config.method) {
      this.method = config.method;
    }
    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }
  }

  isLevelEnabled(level: LogLevel): boolean {
    return shouldLog(this.level, level);
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isDestroyed) {
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    try {
      await this.sendBatch(batch);
    } catch (error) {
      this.handleSendError(error as Error, batch);
    }
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    // Send any remaining logs
    if (this.queue.length > 0) {
      try {
        await this.flush();
      } catch (error) {
        console.error('Failed to flush logs during destroy:', error);
      }
    }
  }

  private async sendBatch(logs: LogEntry[]): Promise<void> {
    const payload = {
      logs: logs.map((log) => this.serializeLogEntry(log)),
      timestamp: new Date().toISOString(),
      source: 'error-core',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private serializeLogEntry(entry: LogEntry): Record<string, unknown> {
    return {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      error: entry.error
        ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
            code: entry.error.code,
          }
        : undefined,
      data: entry.data,
      context: entry.context,
    };
  }

  private handleSendError(error: Error, failedLogs: LogEntry[]): void {
    // Log the transport error to console as fallback
    console.error(`HttpTransport failed to send ${failedLogs.length} log entries:`, error.message);

    // Optionally log the failed entries to console
    if (failedLogs.some((log) => log.level === 'critical' || log.level === 'error')) {
      console.error(
        'Failed critical/error logs:',
        failedLogs
          .filter((log) => log.level === 'critical' || log.level === 'error')
          .map((log) => ({
            level: log.level,
            message: log.message,
            error: log.error,
          })),
      );
    }
  }

  // Utility methods
  getQueueSize(): number {
    return this.queue.length;
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  getBatchSize(): number {
    return this.batchSize;
  }

  getBatchTimeout(): number {
    return this.batchTimeout;
  }
}
