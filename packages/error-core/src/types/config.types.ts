import type { ErrorContext } from './error.types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error' | 'log';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  error?: NormalizedError;
  data?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface NormalizedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  [key: string]: unknown;
}

export interface TransportConfig {
  type: 'console' | 'http' | 'memory' | string;
  enabled?: boolean;
  level?: LogLevel;
  options?: Record<string, unknown>;
}

export interface HttpTransportConfig {
  endpoint: string;
  batchSize?: number;
  batchTimeout?: number;
  headers?: Record<string, string>;
  method?: string;
  timeout?: number;
}

export interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'text' | 'simple';
  transports?: TransportConfig[];
  context?: Record<string, unknown>;
}

export interface ErrorHandlerConfig {
  // Core settings
  autoCapture?: boolean;
  captureUnhandled?: boolean;
  captureRejections?: boolean;

  // Logging
  logLevel?: LogLevel;
  defaultTransports?: TransportConfig[];

  // Context
  defaultContext?: Partial<ErrorContext>;

  // Error handling
  maxBreadcrumbs?: number;
  normalizeStackTraces?: boolean;

  // Performance
  batchSize?: number;
  batchTimeout?: number;
  maxQueueSize?: number;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxAttempts?: number;
}

export interface ContextProvider {
  name: string;
  getContext(): Record<string, unknown>;
}
