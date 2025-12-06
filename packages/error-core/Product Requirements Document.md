# Product Requirements Document: Error Handling & Logging Core Library

## Framework-Agnostic TypeScript Implementation

## 1. Overview

### 1.1 Product Name

**ErrorCore TS** - Framework-Agnostic Error Handling & Logging Library

### 1.2 Design Principles

1. **Zero Dependencies**: Pure TypeScript with no external runtime dependencies
2. **Framework Agnostic**: Can be used with React, Angular, Vue, Svelte, or vanilla JS
3. **Tree-Shakable**: ES Module exports with side-effect-free code
4. **Composable**: Modular architecture for selective feature adoption
5. **Type-Safe**: Full TypeScript support with strict typing

## 2. Core Architecture

### 2.1 Package Structure

```
@error-core/ts/
├── src/
│   ├── core/
│   │   ├── ErrorHandler.ts          # Central orchestrator
│   │   ├── ErrorRegistry.ts         # Error type management
│   │   └── ErrorClassifier.ts       # Error categorization
│   ├── errors/
│   │   ├── BaseError.ts            # Abstract base class
│   │   ├── NetworkError.ts         # HTTP/network errors
│   │   ├── ValidationError.ts      # Data validation errors
│   │   ├── BusinessError.ts        # Domain-specific errors
│   │   └── CompositeError.ts       # Multiple errors container
│   ├── logger/
│   │   ├── Logger.ts               # Main logger interface
│   │   ├── LoggerAdapter.ts        # Adapter pattern interface
│   │   ├── LogLevel.ts            # Log level enums/consts
│   │   └── StructuredLog.ts        # Structured log format
│   ├── strategies/
│   │   ├── RetryStrategy.ts        # Retry mechanisms
│   │   ├── CircuitBreaker.ts       # Circuit breaker pattern
│   │   ├── FallbackStrategy.ts     # Fallback implementations
│   │   └── strategy.types.ts       # Strategy interfaces
│   ├── context/
│   │   ├── ContextManager.ts       # Context management
│   │   ├── ContextProvider.ts      # Context provider interface
│   │   └── BuiltInProviders.ts     # Default context providers
│   ├── transports/
│   │   ├── Transport.ts            # Transport interface
│   │   ├── ConsoleTransport.ts     # Console output
│   │   ├── MemoryTransport.ts      # In-memory storage
│   │   ├── HttpTransport.ts        # HTTP/S endpoint
│   │   └── transport.types.ts      # Transport configurations
│   ├── utils/
│   │   ├── stackTrace.ts           # Stack trace utilities
│   │   ├── errorNormalizer.ts      # Error normalization
│   │   ├── debounce.ts             # Debounce utilities
│   │   └── typeGuards.ts           # Type guard functions
│   └── types/
│       ├── config.types.ts         # Configuration types
│       ├── error.types.ts          # Error type definitions
│       └── index.ts               # Type exports
├── index.ts                       # Main export
└── package.json
```

### 2.2 Type Definitions (Excerpt)

```typescript
// types/error.types.ts
export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business'
  | 'runtime'
  | 'third_party'
  | 'unknown';

export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  userFacing: boolean;
}

export interface ErrorContext {
  // User context
  userId?: string;
  sessionId?: string;

  // Application context
  appVersion?: string;
  environment?: string;

  // Request context
  requestId?: string;
  correlationId?: string;
  endpoint?: string;

  // Browser/Device context
  userAgent?: string;
  url?: string;

  // Custom context
  [key: string]: unknown;
}

export interface CapturedError {
  error: Error;
  metadata: ErrorMetadata;
  context: ErrorContext;
  stack?: string;
  breadcrumbs: ErrorBreadcrumb[];
}

export interface ErrorBreadcrumb {
  message: string;
  category: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}
```

## 3. Core Components

### 3.1 BaseError Class

```typescript
// errors/BaseError.ts
export abstract class BaseError extends Error {
  public readonly name: string;
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly userFacing: boolean;
  public readonly timestamp: Date;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  public readonly breadcrumbs: ErrorBreadcrumb[] = [];

  constructor(
    message: string,
    options: {
      name?: string;
      code?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      recoverable?: boolean;
      retryable?: boolean;
      userFacing?: boolean;
      cause?: Error;
      context?: Partial<ErrorContext>;
    } = {},
  ) {
    super(message);

    this.name = options.name || this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.category = options.category || 'unknown';
    this.severity = options.severity || 'error';
    this.recoverable = options.recoverable ?? true;
    this.retryable = options.retryable ?? false;
    this.userFacing = options.userFacing ?? true;
    this.timestamp = new Date();
    this.context = options.context || {};
    this.originalError = options.cause;

    // Capture stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      retryable: this.retryable,
      userFacing: this.userFacing,
      stack: this.stack,
      context: this.context,
      breadcrumbs: this.breadcrumbs,
      cause: this.originalError?.toJSON?.(),
    };
  }

  public addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date(),
    });
  }
}

// Concrete error classes
export class NetworkError extends BaseError {
  constructor(
    message: string,
    options: {
      statusCode?: number;
      endpoint?: string;
      method?: string;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      name: 'NetworkError',
      code: `NETWORK_${options.statusCode || 'ERROR'}`,
      category: 'network',
      retryable: options.statusCode ? options.statusCode >= 500 : true,
      recoverable: true,
      cause: options.cause,
      context: {
        statusCode: options.statusCode,
        endpoint: options.endpoint,
        method: options.method,
      },
    });
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    options: {
      field?: string;
      validationType?: string;
      value?: unknown;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
      category: 'validation',
      severity: 'warn',
      retryable: false,
      recoverable: true,
      userFacing: true,
      cause: options.cause,
      context: {
        field: options.field,
        validationType: options.validationType,
        value: options.value,
      },
    });
  }
}
```

### 3.2 Logger Interface

```typescript
// logger/Logger.ts
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  critical(message: string, error?: Error, data?: Record<string, unknown>): void;

  // Context management
  withContext(context: Record<string, unknown>): Logger;
  getContext(): Record<string, unknown>;

  // Child loggers
  createChild(prefix: string): Logger;
}

// logger/StructuredLogger.ts
export class StructuredLogger implements Logger {
  private transports: Transport[];
  private context: Record<string, unknown> = {};
  private prefix?: string;

  constructor(
    private config: LoggerConfig = {},
    transports?: Transport[],
  ) {
    this.transports = transports || [new ConsoleTransport()];
  }

  private createLogEntry(level: LogLevel, message: string, error?: Error, data?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message: this.prefix ? `[${this.prefix}] ${message}` : message,
      error: error ? this.normalizeError(error) : undefined,
      data: { ...this.context, ...data },
      context: { ...this.context },
    };
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, undefined, data);
      this.transports.forEach((t) => t.log(entry));
    }
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, error, data);
      this.transports.forEach((t) => t.log(entry));
    }
  }

  withContext(context: Record<string, unknown>): Logger {
    const newLogger = new StructuredLogger(this.config, this.transports);
    newLogger.context = { ...this.context, ...context };
    newLogger.prefix = this.prefix;
    return newLogger;
  }

  createChild(prefix: string): Logger {
    const child = new StructuredLogger(this.config, this.transports);
    child.context = { ...this.context };
    child.prefix = prefix;
    return child;
  }

  private shouldLog(level: LogLevel): boolean {
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4,
    };
    return levelPriority[level] >= levelPriority[this.config.level || 'info'];
  }

  private normalizeError(error: Error): NormalizedError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      ...(error instanceof BaseError ? error.toJSON() : {}),
    };
  }
}
```

### 3.3 Transport Interface

```typescript
// transports/Transport.ts
export interface Transport {
  readonly name: string;

  log(entry: LogEntry): void | Promise<void>;

  configure(config: TransportConfig): void;

  flush?(): void | Promise<void>;

  destroy?(): void | Promise<void>;
}

// transports/ConsoleTransport.ts
export class ConsoleTransport implements Transport {
  readonly name = 'console';

  private readonly levelMap: Record<LogLevel, ConsoleMethod> = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    critical: 'error',
  };

  log(entry: LogEntry): void {
    const method = this.levelMap[entry.level] || 'log';
    const style = this.getStyle(entry.level);

    console[method](
      `%c${entry.timestamp.toISOString()} %c${entry.level.toUpperCase()}%c ${entry.message}`,
      'color: gray',
      style,
      'color: inherit',
      entry.data,
    );

    if (entry.error) {
      console[method]('Error:', entry.error);
    }
  }

  private getStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: cyan; font-weight: bold',
      info: 'color: blue; font-weight: bold',
      warn: 'color: orange; font-weight: bold',
      error: 'color: red; font-weight: bold',
      critical: 'color: white; background: red; font-weight: bold',
    };
    return styles[level];
  }
}

// transports/HttpTransport.ts
export class HttpTransport implements Transport {
  readonly name = 'http';

  private endpoint: string;
  private batchSize: number = 10;
  private batchTimeout: number = 5000;
  private queue: LogEntry[] = [];
  private timer?: NodeJS.Timeout;
  private headers: Record<string, string> = {};

  constructor(config: HttpTransportConfig) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize || this.batchSize;
    this.batchTimeout = config.batchTimeout || this.batchTimeout;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  log(entry: LogEntry): void {
    this.queue.push(entry);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeout);
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      // Fallback to console if HTTP fails
      console.error('Failed to send logs:', error);
      batch.forEach((entry) => {
        console.log(`[HTTP Transport Failed] ${entry.message}`, entry.data);
      });
    }
  }
}
```

### 3.4 Error Handler Core

```typescript
// core/ErrorHandler.ts
export class ErrorHandler {
  private static instance: ErrorHandler;
  private registry = new ErrorRegistry();
  private transports: Transport[] = [];
  private contextProviders: ContextProvider[] = [];
  private unhandledErrorHandlers: Array<(error: Error) => void> = [];
  private isInitialized = false;

  private constructor(private config: ErrorHandlerConfig = {}) {}

  static initialize(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      throw new Error('ErrorHandler not initialized. Call initialize() first.');
    }
    return ErrorHandler.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;

    this.registerGlobalHandlers();
    this.registerBuiltInErrors();
    this.isInitialized = true;
  }

  captureError(
    error: Error | unknown,
    metadata?: Partial<ErrorMetadata>,
    additionalContext?: Record<string, unknown>,
  ): string {
    const errorId = this.generateErrorId();
    const normalizedError = this.normalizeError(error);
    const mergedMetadata = this.mergeMetadata(normalizedError, metadata);
    const context = this.collectContext(additionalContext);

    const capturedError: CapturedError = {
      error: normalizedError,
      metadata: mergedMetadata,
      context,
      stack: normalizedError.stack,
      breadcrumbs: normalizedError instanceof BaseError ? normalizedError.breadcrumbs : [],
    };

    // Send to all transports
    this.transports.forEach((transport) => {
      try {
        transport.log(this.createLogEntry(capturedError));
      } catch (transportError) {
        console.error('Transport error:', transportError);
      }
    });

    // Execute custom handlers
    this.unhandledErrorHandlers.forEach((handler) => {
      try {
        handler(normalizedError);
      } catch (handlerError) {
        console.error('Error handler error:', handlerError);
      }
    });

    return errorId;
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  addContextProvider(provider: ContextProvider): void {
    this.contextProviders.push(provider);
  }

  onUnhandledError(handler: (error: Error) => void): () => void {
    this.unhandledErrorHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.unhandledErrorHandlers.indexOf(handler);
      if (index > -1) {
        this.unhandledErrorHandlers.splice(index, 1);
      }
    };
  }

  private collectContext(additional?: Record<string, unknown>): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
    };

    // Collect from all providers
    this.contextProviders.forEach((provider) => {
      try {
        Object.assign(context, provider.getContext());
      } catch (error) {
        console.warn('Context provider failed:', error);
      }
    });

    // Add additional context
    if (additional) {
      Object.assign(context, additional);
    }

    return context;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error(`Non-Error object thrown: ${JSON.stringify(error)}`);
  }

  private registerGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          category: 'runtime',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(event.reason, {
          category: 'runtime',
        });
      });
    }

    if (typeof process !== 'undefined') {
      // Node.js environment
      process.on('uncaughtException', (error) => {
        this.captureError(error, {
          category: 'runtime',
          severity: 'critical',
        });
      });

      process.on('unhandledRejection', (reason) => {
        this.captureError(reason, {
          category: 'runtime',
        });
      });
    }
  }
}
```

### 3.5 Strategy Patterns

```typescript
// strategies/RetryStrategy.ts
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: Error, attempt: number) => boolean;
}

export class RetryStrategy {
  constructor(private options: RetryOptions) {}

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (error: Error, attempt: number, delay: number) => void,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === this.options.maxAttempts) break;
        if (!this.shouldRetry(error as Error, attempt)) break;

        // Calculate delay with exponential backoff and optional jitter
        const delay = this.calculateDelay(attempt);

        // Notify about retry
        onRetry?.(error as Error, attempt, delay);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (this.options.retryCondition) {
      return this.options.retryCondition(error, attempt);
    }

    // Default retry condition: retry network errors and 5xx status codes
    const isNetworkError = error.name.includes('Network') || error.name.includes('Timeout');
    const isServerError = (error as any).statusCode >= 500;

    return isNetworkError || isServerError;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);

    delay = Math.min(delay, this.options.maxDelay);

    if (this.options.jitter) {
      delay = delay * (0.8 + Math.random() * 0.4); // 20% jitter
    }

    return Math.round(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// strategies/CircuitBreaker.ts
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: Date;
  private nextAttempt?: Date;

  constructor(
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenMaxAttempts: 3,
    },
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.ensureState();

    switch (this.state) {
      case 'OPEN':
        throw new CircuitOpenError(`Circuit breaker is OPEN. Next attempt at ${this.nextAttempt}`);

      case 'HALF_OPEN':
        if (this.failures >= this.options.halfOpenMaxAttempts!) {
          this.trip();
          throw new CircuitOpenError('Circuit breaker reopened after half-open failures');
        }
        break;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private ensureState(): void {
    if (this.state === 'OPEN' && this.nextAttempt && new Date() > this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.failures = 0;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.reset();
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === 'CLOSED' && this.failures >= this.options.failureThreshold) {
      this.trip();
    } else if (this.state === 'HALF_OPEN') {
      // Already handled in execute method
    }
  }

  private trip(): void {
    this.state = 'OPEN';
    this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = undefined;
    this.nextAttempt = undefined;
  }

  getState(): CircuitState {
    this.ensureState();
    return this.state;
  }
}
```

## 4. Configuration Types

```typescript
// types/config.types.ts
export interface ErrorCoreConfig {
  // Core settings
  autoCapture?: boolean;
  captureUnhandled?: boolean;
  captureRejections?: boolean;

  // Logging
  logLevel?: LogLevel;
  defaultTransports?: TransportConfig[];

  // Context
  defaultContext?: Partial<ErrorContext>;
  contextProviders?: ContextProvider[];

  // Error handling
  maxBreadcrumbs?: number;
  normalizeStackTraces?: boolean;

  // Performance
  batchSize?: number;
  batchTimeout?: number;
  maxQueueSize?: number;
}

export interface TransportConfig {
  type: 'console' | 'http' | 'memory' | string;
  enabled?: boolean;
  level?: LogLevel;
  options?: Record<string, unknown>;
}

export interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'text' | 'simple';
  transports?: TransportConfig[];
  context?: Record<string, unknown>;
}
```

## 5. Public API

```typescript
// Main exports
export { ErrorHandler } from './core/ErrorHandler';
export { StructuredLogger } from './logger/StructuredLogger';
export { BaseError, NetworkError, ValidationError, BusinessError } from './errors';
export { RetryStrategy, CircuitBreaker } from './strategies';
export { ConsoleTransport, HttpTransport, MemoryTransport } from './transports';

// Type exports
export type {
  ErrorSeverity,
  ErrorCategory,
  ErrorMetadata,
  ErrorContext,
  CapturedError,
  LogLevel,
  LogEntry,
  Transport,
  Logger,
} from './types';

// Utilities
export { normalizeError } from './utils/errorNormalizer';
export { captureStackTrace } from './utils/stackTrace';
export { createErrorId } from './utils/idGenerator';

// Factory function
export function createErrorCore(config: ErrorCoreConfig = {}) {
  const errorHandler = ErrorHandler.initialize(config);
  const logger = new StructuredLogger({
    level: config.logLevel || 'info',
  });

  // Add default transports
  if (config.defaultTransports) {
    config.defaultTransports.forEach((transportConfig) => {
      // Implementation depends on transport type
    });
  }

  return {
    errorHandler,
    logger,
    captureError: errorHandler.captureError.bind(errorHandler),
    createLogger: (name: string) => logger.createChild(name),
  };
}

// Singleton instance
export const errorCore = createErrorCore();
```

## 6. Usage Examples

### 6.1 Basic Setup

```typescript
import { createErrorCore, NetworkError, ValidationError, ConsoleTransport, HttpTransport } from '@error-core/ts';

// Initialize
const errorCore = createErrorCore({
  logLevel: 'debug',
  autoCapture: true,
  defaultTransports: [
    { type: 'console', level: 'debug' },
    {
      type: 'http',
      level: 'error',
      options: { endpoint: '/api/logs' },
    },
  ],
});

// Usage
try {
  await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    errorCore.captureError(error, {
      severity: 'warn',
      userFacing: true,
    });
  } else {
    errorCore.captureError(error);
  }
}

// Structured logging
const logger = errorCore.createLogger('api-client');
logger.info('Request started', { endpoint: '/users' });
logger.error('Request failed', error, { attempt: 3 });
```

### 6.2 Custom Error Types

```typescript
import { BaseError } from '@error-core/ts';

export class PaymentError extends BaseError {
  constructor(
    message: string,
    options: {
      paymentId?: string;
      amount?: number;
      provider?: string;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      name: 'PaymentError',
      code: 'PAYMENT_FAILED',
      category: 'business',
      severity: 'error',
      recoverable: true,
      retryable: true,
      userFacing: false,
      cause: options.cause,
      context: {
        paymentId: options.paymentId,
        amount: options.amount,
        provider: options.provider,
      },
    });
  }
}

// Usage
throw new PaymentError('Insufficient funds', {
  paymentId: 'pay_123',
  amount: 100,
  provider: 'stripe',
});
```

### 6.3 Strategy Patterns

```typescript
import { RetryStrategy, CircuitBreaker } from '@error-core/ts';

// Retry with exponential backoff
const retry = new RetryStrategy({
  maxAttempts: 3,
  baseDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
  jitter: true,
});

await retry.execute(
  async () => await apiCall(),
  (error, attempt, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms:`, error.message);
  },
);

// Circuit breaker
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
});

await circuitBreaker.execute(async () => await externalServiceCall());
```

## 7. Framework Integration Examples

### 7.1 React Integration (Separate Package)

```typescript
// @error-core/react
import { ErrorHandler, BaseError } from '@error-core/ts';
import React from 'react';

export class ReactError extends BaseError {
  constructor(
    componentName: string,
    error: Error,
    options?: { props?: Record<string, unknown> }
  ) {
    super(`React error in ${componentName}`, {
      name: 'ReactError',
      category: 'runtime',
      cause: error,
      context: {
        component: componentName,
        props: options?.props,
      },
    });
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: ErrorBoundaryOptions
) {
  return class ErrorBoundary extends React.Component<P> {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const reactError = new ReactError(
        Component.displayName || Component.name,
        error,
        { props: this.props }
      );

      ErrorHandler.getInstance().captureError(reactError, {
        context: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    render() {
      if (this.state.hasError) {
        return options?.fallback || <div>Something went wrong</div>;
      }
      return <Component {...this.props} />;
    }
  };
}
```

### 7.2 Vue Integration (Separate Package)

```typescript
// @error-core/vue
import { ErrorHandler, BaseError } from '@error-core/ts';
import { App, VNode } from 'vue';

export class VueError extends BaseError {
  constructor(componentName: string, error: Error, options?: { instance?: any }) {
    super(`Vue error in ${componentName}`, {
      name: 'VueError',
      category: 'runtime',
      cause: error,
      context: {
        component: componentName,
        instance: options?.instance,
      },
    });
  }
}

export function createErrorHandlingPlugin() {
  return {
    install(app: App) {
      app.config.errorHandler = (err: unknown, instance: any, info: string) => {
        const vueError = new VueError(instance?.$options.name || 'Unknown', err as Error, { instance });

        ErrorHandler.getInstance().captureError(vueError, {
          context: { info },
        });
      };
    },
  };
}
```

## 8. Performance Considerations

### 8.1 Memory Management

```typescript
// transports/MemoryTransport.ts
export class MemoryTransport implements Transport {
  private logs: LogEntry[] = [];
  private maxSize: number = 1000;

  log(entry: LogEntry): void {
    this.logs.push(entry);

    // Remove oldest logs if exceeding max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}
```

### 8.2 Debounced Logging

```typescript
// utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Usage in transport
export class DebouncedTransport implements Transport {
  private queue: LogEntry[] = [];
  private flushDebounced: () => void;

  constructor(
    private delegate: Transport,
    delay: number = 100,
  ) {
    this.flushDebounced = debounce(() => this.flush(), delay);
  }

  log(entry: LogEntry): void {
    this.queue.push(entry);
    this.flushDebounced();
  }

  private flush(): void {
    this.queue.forEach((entry) => this.delegate.log(entry));
    this.queue = [];
  }
}
```

## 9. Testing Utilities

```typescript
// test-utils/mocks.ts
export class MockTransport implements Transport {
  readonly name = 'mock';
  logs: LogEntry[] = [];

  log(entry: LogEntry): void {
    this.logs.push(entry);
  }

  configure(): void {
    // No-op
  }

  clear(): void {
    this.logs = [];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }
}

export function createTestErrorHandler(): {
  handler: ErrorHandler;
  transport: MockTransport;
} {
  const transport = new MockTransport();
  const handler = ErrorHandler.initialize({
    autoCapture: false,
  });

  handler.addTransport(transport);
  return { handler, transport };
}
```

## 10. Build Configuration

```json
{
  "name": "@error-core/ts",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./errors": {
      "import": "./dist/errors/index.js",
      "types": "./dist/errors/index.d.ts"
    },
    "./logger": {
      "import": "./dist/logger/index.js",
      "types": "./dist/logger/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc && tsc-alias",
    "build:watch": "tsc --watch",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsc-alias": "^1.8.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": ["error", "logging", "typescript", "framework-agnostic", "error-handling"]
}
```

## 11. Key Features Summary

1. **Zero Dependencies**: Pure TypeScript implementation
2. **Tree-Shakable**: ES Modules with side-effect-free code
3. **Type-Safe**: Full TypeScript support with strict typing
4. **Extensible**: Plugin architecture for transports and strategies
5. **Performance**: Debounced logging, memory management
6. **Cross-Platform**: Works in Browser and Node.js
7. **Composable**: Import only what you need
8. **Testable**: Built-in testing utilities and mocks

This implementation provides a solid foundation that can be extended with framework-specific adapters while maintaining a clean, dependency-free core.
